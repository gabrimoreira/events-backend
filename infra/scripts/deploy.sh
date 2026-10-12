#!/usr/bin/env bash
# Full AWS deploy: ECR repos -> build/push images -> everything else.
# Requires: terraform, aws cli (Learner Lab credentials exported) and docker.
# Use DOCKER="sudo docker" if your user cannot reach the docker socket.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TF="$ROOT/infra/terraform"
DOCKER="${DOCKER:-docker}"
FRONTEND_PATH="${FRONTEND_PATH:-$ROOT/../events-frontend}"
REGION="${AWS_REGION:-us-east-1}"
PROJECT=eventflow

cd "$TF"
terraform init -input=false
terraform apply -input=false -auto-approve -target=aws_ecr_repository.image

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com"
aws ecr get-login-password --region "$REGION" | $DOCKER login --username AWS --password-stdin "$REGISTRY"

cd "$ROOT"
build_push() {
  local name=$1; shift
  $DOCKER build "$@" -t "$REGISTRY/$PROJECT/$name:latest" .
  $DOCKER push "$REGISTRY/$PROJECT/$name:latest"
}

build_push gateway -f apps/gateway/Dockerfile --build-context "frontend=$FRONTEND_PATH" --build-arg VITE_API_URL=http://__API_HOST__/api
for app in auth-service catalog-service sales-service processing-worker; do
  build_push "$app" --build-arg "APP=$app"
done
build_push migrate --target migrate --build-arg APP=auth-service

cd "$TF"
terraform apply -input=false -auto-approve
terraform output app_url
