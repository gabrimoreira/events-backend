data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

locals {
  registry = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"

  user_data_vars = {
    project      = var.project
    registry     = local.registry
    region       = var.region
    database_url = "postgresql://eventflow:${random_password.db.result}@${aws_db_instance.main.address}:5432/eventflow"
    redis_url    = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:6379"
    bucket       = terraform_data.bucket.output
    audit_table  = aws_dynamodb_table.audit.name
    topic_arn    = aws_sns_topic.events.arn
    ticket_queue = aws_sqs_queue.main["${var.project}-ticket-jobs"].name
    image_queue  = aws_sqs_queue.main["${var.project}-image-jobs"].name
    jwt_secret   = random_password.jwt.result
    alb_dns      = aws_lb.main.dns_name
  }
}

# ---------------------------------------------------------------- Web fleet (ALB + ASG)

resource "aws_launch_template" "web" {
  name_prefix   = "${var.project}-web-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = data.aws_iam_instance_profile.lab.name
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  # 1-minute CPU metrics, required for the "> 1 minute" scaling rules.
  monitoring {
    enabled = true
  }

  user_data = base64encode(templatefile("${path.module}/templates/user-data.sh.tftpl",
  merge(local.user_data_vars, { role = "web" })))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${var.project}-web" }
  }
}

resource "aws_lb" "main" {
  name               = "${var.project}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "web" {
  name     = "${var.project}-web"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  deregistration_delay = 30

  health_check {
    path                = "/healthz"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_autoscaling_group" "web" {
  name                      = "${var.project}-web"
  min_size                  = 1
  max_size                  = 3
  desired_capacity          = 1
  vpc_zone_identifier       = aws_subnet.public[*].id
  target_group_arns         = [aws_lb_target_group.web.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 600
  metrics_granularity       = "1Minute"

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project}-web"
    propagate_at_launch = true
  }

  # Instances need the DB, cache and images to exist.
  depends_on = [aws_db_instance.main, aws_elasticache_cluster.main]
}

resource "aws_autoscaling_policy" "scale_out" {
  name                   = "${var.project}-scale-out"
  autoscaling_group_name = aws_autoscaling_group.web.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown               = 120
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "${var.project}-scale-in"
  autoscaling_group_name = aws_autoscaling_group.web.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 120
}

# Average CPU of the group above 70% for 1 minute: add an instance (max 3).
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project}-cpu-high"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 1
  threshold           = 70
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [aws_autoscaling_policy.scale_out.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }
}

# Average CPU of the group below 25% for 1 minute: remove an instance (min 1).
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.project}-cpu-low"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 1
  threshold           = 25
  comparison_operator = "LessThanThreshold"
  alarm_actions       = [aws_autoscaling_policy.scale_in.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.web.name
  }
}

# ---------------------------------------------------------------- Worker (decoupled via SQS)

resource "aws_instance" "worker" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = data.aws_iam_instance_profile.lab.name

  user_data = templatefile("${path.module}/templates/user-data.sh.tftpl",
  merge(local.user_data_vars, { role = "worker" }))

  tags = { Name = "${var.project}-worker" }
}
