#!/bin/bash
set -euo pipefail

REGION="us-east-1"
ECR_IMAGE="851725402279.dkr.ecr.us-east-1.amazonaws.com/weight-loss-clinic-api:latest"
COMPOSE="/usr/local/bin/docker-compose"
ENV_FILE="/opt/weightloss/.env"

aws ecr get-login-password --region "$REGION" | sudo docker login --username AWS --password-stdin "${ECR_IMAGE%:*}"

sudo "$COMPOSE" pull

if [[ "${1:-}" == "migrate" ]]; then
  sudo docker run --rm --env-file "$ENV_FILE" "$ECR_IMAGE" npx prisma migrate deploy
fi

sudo "$COMPOSE" up -d
sudo docker image prune -f >/dev/null 2>&1
