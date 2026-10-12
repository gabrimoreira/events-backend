resource "aws_sns_topic" "events" {
  name = "${var.project}-domain-events"
}

locals {
  queues = {
    "${var.project}-ticket-jobs" = "ORDER_PAID"
    "${var.project}-image-jobs"  = "BANNER_UPLOADED"
  }
}

resource "aws_sqs_queue" "dlq" {
  for_each = local.queues

  name = "${each.key}-dlq"
}

resource "aws_sqs_queue" "main" {
  for_each = local.queues

  name                       = each.key
  visibility_timeout_seconds = 60

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "from_sns" {
  for_each = local.queues

  queue_url = aws_sqs_queue.main[each.key].url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "sns.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.main[each.key].arn
      Condition = { ArnEquals = { "aws:SourceArn" = aws_sns_topic.events.arn } }
    }]
  })
}

resource "aws_sns_topic_subscription" "queue" {
  for_each = local.queues

  topic_arn            = aws_sns_topic.events.arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.main[each.key].arn
  raw_message_delivery = true
  filter_policy        = jsonencode({ type = [each.value] })

  depends_on = [aws_sqs_queue_policy.from_sns]
}
