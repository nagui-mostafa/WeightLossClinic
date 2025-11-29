#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="us-east-1"
ACCOUNT_ID="851725402279"
ECR_REPO="weight-loss-clinic-api"
IMAGE_NAME="weight-loss-clinic-api"
INSTANCE_ID="i-0f9d8eab11737f436"
PROFILE="default"
MIGRATE=false
SKIP_BUILD=false
TAG_SUFFIX="$(git rev-parse --short HEAD)"
SET_MINIO_POLICY=false

usage() {
  cat <<'USAGE'
Usage: scripts/full-deploy.sh [OPTIONS]

Options:
  --profile <name>        AWS CLI profile to use (default: default)
  --region <region>       AWS region (default: us-east-1)
  --tag <tag>             Override image tag suffix (default: current git hash)
  --skip-build            Skip docker build/tag/push (useful if already pushed)
  --migrate               Run prisma migrate during deploy
  --set-minio-policy      Also re-apply MinIO anonymous download policy
  -h, --help              Show this help text

This script will:
  1. Build and push the API docker image to ECR (unless --skip-build).
  2. Run the deploy script on the EC2 host via AWS SSM.
  3. Optionally run migrations and/or re-apply the MinIO bucket policy.

Prerequisites:
  - Docker CLI installed and logged in locally.
  - AWS CLI v2 installed and configured with SSO/keys for the target account.
  - Instance i-0f9d8eab11737f436 managed by SSM (already true in prod).
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="$2"; shift 2;;
    --region)
      AWS_REGION="$2"; shift 2;;
    --tag)
      TAG_SUFFIX="$2"; shift 2;;
    --skip-build)
      SKIP_BUILD=true; shift;;
    --migrate)
      MIGRATE=true; shift;;
    --set-minio-policy)
      SET_MINIO_POLICY=true; shift;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1;;
  esac
done

REMOTE_COMMANDS=("cd /opt/weightloss")
if $MIGRATE; then
  REMOTE_COMMANDS+=("sudo /opt/weightloss/deploy.sh migrate")
else
  REMOTE_COMMANDS+=("sudo /opt/weightloss/deploy.sh")
fi
if $SET_MINIO_POLICY; then
  REMOTE_COMMANDS+=(
    "sudo docker run --rm --network host --entrypoint /bin/sh minio/mc -c \"mc alias set local http://127.0.0.1:9000 devaccess devsecret && mc anonymous set download local/weight-loss-media\""
  )
fi

IMAGE_TAG="${IMAGE_NAME}:${TAG_SUFFIX}"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${TAG_SUFFIX}"

if ! $SKIP_BUILD; then
  echo "[1/3] Building docker image ${IMAGE_TAG}"
  docker build -t "${IMAGE_TAG}" .

  echo "[2/3] Tagging image as ${ECR_URI}"
  docker tag "${IMAGE_TAG}" "${ECR_URI}"

  echo "Logging into ECR ${ACCOUNT_ID} (${AWS_REGION}) with profile ${PROFILE}"
  aws --profile "$PROFILE" --region "$AWS_REGION" ecr get-login-password \
    | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

  echo "[3/3] Pushing image ${ECR_URI}"
  docker push "${ECR_URI}"
else
  echo "Skipping build/push (per flag). Ensure ${ECR_URI} already exists."
fi

echo "Invoking remote deploy via AWS SSM"
COMMAND_ID=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=$(printf "%s\n" "${REMOTE_COMMANDS[@]}")" \
  --query 'Command.CommandId' --output text)

echo "Waiting for SSM command ${COMMAND_ID} to finish..."
aws --profile "$PROFILE" --region "$AWS_REGION" ssm wait command-executed \
  --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID"

echo "Deployment complete. Check CloudWatch log group /weightloss/api or run 'awslogs get /weightloss/api ALL' for details."
