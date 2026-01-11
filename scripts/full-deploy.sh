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
RUN_SEED=false
RUN_SMOKE=false
PUSH_LATEST=true
UPDATE_ENV=false
ENV_SOURCE="prod.env"
SET_VARS=()
SEED_GROUPON_TESTS=false
SEED_ADMINS=false

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
  --seed                  Run prisma seed on the host after deploy
  --seed-admins           Create/update admin users (non-destructive) on the host
  --seed-groupon-tests    Insert the Groupon QA coupons (non-destructive) on the host
  --smoke                 Run post-deploy smoke tests (health, ready, categories)
  --no-latest             Do not tag/push the image as :latest (deploy.sh pulls :latest by default)
  --update-env            Push local env file to /opt/weightloss/.env on the host before deploy
  --env-file <path>       Path to env file to push (default: prod.env)
  --set-var KEY=VALUE     Set or replace a single env var on the host (may be repeated)
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
    --seed)
      RUN_SEED=true; shift;;
    --seed-admins)
      SEED_ADMINS=true; shift;;
    --seed-groupon-tests)
      SEED_GROUPON_TESTS=true; shift;;
    --smoke)
      RUN_SMOKE=true; shift;;
    --no-latest)
      PUSH_LATEST=false; shift;;
    --update-env)
      UPDATE_ENV=true; shift;;
    --env-file)
      ENV_SOURCE="$2"; shift 2;;
    --set-var)
      SET_VARS+=("$2"); shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1;;
  esac
done

# compute image tags after parsing options
IMAGE_TAG="${IMAGE_NAME}:${TAG_SUFFIX}"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${TAG_SUFFIX}"
ECR_URI_LATEST="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:latest"
SEED_IMAGE="$ECR_URI_LATEST"
if ! $PUSH_LATEST; then
  SEED_IMAGE="$ECR_URI"
fi

REMOTE_COMMANDS=("cd /opt/weightloss")
if $MIGRATE; then
  REMOTE_COMMANDS+=("sudo /opt/weightloss/deploy.sh migrate")
else
  REMOTE_COMMANDS+=("sudo /opt/weightloss/deploy.sh")
fi
if $RUN_SEED; then
  REMOTE_COMMANDS+=("sudo docker run --rm --env-file /opt/weightloss/.env -v /opt/weightloss/tsconfig.json:/app/tsconfig.json ${SEED_IMAGE} npm run db:seed")
fi
if $SEED_ADMINS; then
  REMOTE_COMMANDS+=("sudo docker run --rm --env-file /opt/weightloss/.env -v /opt/weightloss/tsconfig.json:/app/tsconfig.json ${SEED_IMAGE} npm run db:seed-admins")
fi
if $RUN_SMOKE; then
  REMOTE_COMMANDS+=(
    "echo 'Health:' && curl -sf http://127.0.0.1:3000/health"
    "echo 'Ready:' && curl -sf http://127.0.0.1:3000/ready"
    "echo 'Categories:' && curl -sf http://127.0.0.1:3000/v1/products/categories | head -c 400"
  )
fi
if $SET_MINIO_POLICY; then
  REMOTE_COMMANDS+=(
    "sudo docker run --rm --network host --entrypoint /bin/sh minio/mc -c \"mc alias set local http://127.0.0.1:9000 devaccess devsecret && mc anonymous set download local/weight-loss-media\""
  )
fi
if $SEED_GROUPON_TESTS; then
  REMOTE_COMMANDS+=("sudo docker run --rm --env-file /opt/weightloss/.env -v /opt/weightloss/tsconfig.json:/app/tsconfig.json ${SEED_IMAGE} npx ts-node -r tsconfig-paths/register scripts/seed-groupon-test-codes.ts")
fi

if ! $SKIP_BUILD; then
  echo "[1/3] Building docker image ${IMAGE_TAG}"
  docker build -t "${IMAGE_TAG}" .

  echo "[2/3] Tagging image as ${ECR_URI}"
  docker tag "${IMAGE_TAG}" "${ECR_URI}"
  if $PUSH_LATEST; then
    echo "Tagging image as ${ECR_URI_LATEST}"
    docker tag "${IMAGE_TAG}" "${ECR_URI_LATEST}"
  fi

  echo "Logging into ECR ${ACCOUNT_ID} (${AWS_REGION}) with profile ${PROFILE}"
  aws --profile "$PROFILE" --region "$AWS_REGION" ecr get-login-password \
    | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

  echo "[3/3] Pushing image ${ECR_URI}"
  docker push "${ECR_URI}"
  if $PUSH_LATEST; then
    echo "Pushing image ${ECR_URI_LATEST}"
    docker push "${ECR_URI_LATEST}"
  fi
else
  echo "Skipping build/push (per flag). Ensure ${ECR_URI} already exists."
fi

# Optional: push full env file
if $UPDATE_ENV; then
  if [[ ! -f "$ENV_SOURCE" ]]; then
    echo "Env file not found: $ENV_SOURCE" >&2
    exit 1
  fi
  echo "Pushing env file $ENV_SOURCE to /opt/weightloss/.env on host"
  ENV_B64=$(base64 < "$ENV_SOURCE" | tr -d '\n')
  LOCAL_MD5=$(md5 -q "$ENV_SOURCE" 2>/dev/null || md5sum "$ENV_SOURCE" | awk '{print $1}')
  ENV_COMMANDS_JSON="[\"echo '$ENV_B64' | base64 -d | sudo tee /opt/weightloss/.env >/dev/null\",\"sudo md5sum /opt/weightloss/.env\"]"
  ENV_CMD_ID=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=$ENV_COMMANDS_JSON" \
    --query 'Command.CommandId' --output text)
  echo "Waiting for env push command ${ENV_CMD_ID}..."
  aws --profile "$PROFILE" --region "$AWS_REGION" ssm wait command-executed \
    --command-id "$ENV_CMD_ID" --instance-id "$INSTANCE_ID"
  ENV_STATUS=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm get-command-invocation \
    --command-id "$ENV_CMD_ID" --instance-id "$INSTANCE_ID" --query 'Status' --output text)
  if [[ "$ENV_STATUS" != "Success" ]]; then
    echo "Env push failed (status: $ENV_STATUS). Check SSM command $ENV_CMD_ID." >&2
    exit 1
  fi
  REMOTE_MD5=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm get-command-invocation \
    --command-id "$ENV_CMD_ID" --instance-id "$INSTANCE_ID" --query 'StandardOutputContent' --output text | tail -n 1 | awk '{print $1}')
  echo "Local env MD5:  $LOCAL_MD5"
  echo "Remote env MD5: $REMOTE_MD5"
  if [[ "$LOCAL_MD5" != "$REMOTE_MD5" ]]; then
    echo "Env MD5 mismatch after upload!" >&2
    exit 1
  fi
fi

# Optional: set individual env vars on host
if [[ ${#SET_VARS[@]} -gt 0 ]]; then
  SET_COMMANDS=()
  for kv in "${SET_VARS[@]}"; do
    KEY="${kv%%=*}"
    VAL="${kv#*=}"
    CMD="sudo sh -c \"sed -i '/^${KEY}=.*$/d' /opt/weightloss/.env && echo '${KEY}=${VAL}' >> /opt/weightloss/.env\""
    SET_COMMANDS+=("$CMD")
  done
  SET_COMMANDS_JOINED=$(printf "%s\n" "${SET_COMMANDS[@]}")
  COMMANDS_JSON=$(SET_COMMANDS_JOINED="$SET_COMMANDS_JOINED" python3 - <<'PY'
import json, os
cmds = [line for line in os.environ.get("SET_COMMANDS_JOINED","").splitlines() if line.strip()]
print(json.dumps(cmds))
PY
)
  CMD_ID=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=${COMMANDS_JSON}" \
    --query 'Command.CommandId' --output text)
  echo "Waiting for env set command ${CMD_ID}..."
  aws --profile "$PROFILE" --region "$AWS_REGION" ssm wait command-executed \
    --command-id "$CMD_ID" --instance-id "$INSTANCE_ID"
  STATUS=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm get-command-invocation \
    --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --query 'Status' --output text)
  if [[ "$STATUS" != "Success" ]]; then
    echo "Setting env vars failed (status: $STATUS). Check SSM command $CMD_ID." >&2
    exit 1
  fi
fi

echo "Invoking remote deploy via AWS SSM"
COMMANDS_JSON=$(printf '"%s",' "${REMOTE_COMMANDS[@]}")
COMMANDS_JSON="[${COMMANDS_JSON%,}]"
COMMAND_PARAM="commands=${COMMANDS_JSON}"
COMMAND_ID=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "$COMMAND_PARAM" \
  --query 'Command.CommandId' --output text)

echo "Waiting for SSM command ${COMMAND_ID} to finish..."
aws --profile "$PROFILE" --region "$AWS_REGION" ssm wait command-executed \
  --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID"

STATUS=$(aws --profile "$PROFILE" --region "$AWS_REGION" ssm get-command-invocation \
  --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --query 'Status' --output text)
echo "SSM command status: ${STATUS}"
if [[ "$STATUS" != "Success" ]]; then
  echo "Deployment failed (status: ${STATUS}). Check SSM command ${COMMAND_ID} and CloudWatch logs." >&2
  exit 1
fi

echo "Deployment complete. Check CloudWatch log group /weightloss/api or run 'awslogs get /weightloss/api ALL' for details."
