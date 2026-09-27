# Credentials: AWS Academy Learner Lab → "AWS Details" → copy into ~/.aws/credentials
# (they expire with the lab session, ~4 h).
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}
