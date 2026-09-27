# Learner Lab accounts cannot create IAM roles. EC2 instances use the pre-created
# LabInstanceProfile (LabRole), which can reach S3, DynamoDB, SNS, SQS and ECR.
data "aws_iam_instance_profile" "lab" {
  name = "LabInstanceProfile"
}
