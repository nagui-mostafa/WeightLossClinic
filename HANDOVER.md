# Weight Loss Clinic - Handover

> Goal: give you (a fresh grad engineer) the exact steps to understand, run, deploy, and operate this NestJS API without hunting through multiple docs.

---

## 1. System In 60 Seconds
- **Stack**: NestJS + Prisma + PostgreSQL + Docker. Logging via Pino, metrics via `/metrics`, health checks at `/health` and `/ready`.
- **Infra**: Single EC2 host (`i-0f9d8eab11737f436`) in `us-east-1`, fronted by nginx, talking to RDS (`weight-loss-db`). Images temporarily live in MinIO on the same host.
- **Key repos/files**: `src/` (API), `prisma/schema.prisma`, `docs/architecture.md`, `DEPLOYMENT_RUNBOOK.txt`, `scripts/full-deploy.sh`, `Commands`.

---

## 2. Architecture Map
```
Clients (Web, Admin UI, Swagger)
        |
 HTTPS via nginx (api.joeymed.com)
        |
  NestJS app (Docker)
        |
      Prisma
        |
   PostgreSQL (RDS)
        |
 External helpers (SMTP, MinIO/S3, CloudWatch, Groupon API)
```

### Core Bootstrapping
- `src/main.ts`: creates the Nest app, applies global validation pipes, security middlewares, and Swagger.
- `src/app.module.ts`: imports every feature module listed below.

### Feature Modules & Main Classes
| Module (folder) | Main classes | What they do |
| --- | --- | --- |
| `auth` | `AuthController`, `AuthService`, JWT strategies, guards | Signup/login, refresh rotation, password reset, email verification, `/auth/me`. |
| `users` | `UsersController`, `UsersService` | Admin + patient profile CRUD, role/status changes, pagination. |
| `records` | `RecordsController`, `RecordsService` | Medication records tied to users, strict ownership guard, admin overrides. |
| `products` | `ProductsController`, `ProductsService` | Public weight-loss catalog endpoints plus admin CRUD with image uploads. |
| `groupon` | `GrouponController`, `GrouponService`, `GrouponSignatureService`, `ReconciliationService` | Validates Groupon signatures, redeems vouchers, reconciles mismatches. |
| `admin` | `AdminController`, `AdminService` | Audit log search, stats dashboards, internal insights. |
| `mail` | `MailModule`, `MailService` | SMTP transport + templated transactional emails. |
| `health` | `HealthController` | `/health`, `/ready`, `/metrics`. |
| `common` | `PrismaService`, `JwtAuthGuard`, interceptors, decorators | Shared utilities, logging, request context, rate limiting helpers. |
| `config` | `ConfigModule`, typed config providers | Validates env vars via Joi and exposes them through Nest’s config service. |

### Primary Flows
1. **Patient signup/login**: `AuthController` → `AuthService` → `PrismaService` (creates user + refresh session) → JWT tokens returned. Optional email verification toggles token issuance.
2. **Record updates**: `RecordsController` checks guards → `RecordsService` enforces owner/admin logic → `PrismaService` persists medication entry → audit log stored via `AdminService`.
3. **Weight-loss catalog**: `ProductsController` exposes GET endpoints for frontend + secure PUT/POST routes for admins. Upload paths are generated and saved against MinIO/S3 using `OBJECT_STORAGE_*` env vars.
4. **Groupon redemption**: `GrouponController` receives webhook/redeem requests, verifies shared secrets in `GrouponSignatureService`, then marks vouchers in DB and emits audit events.

Keep `docs/architecture.md` handy for diagrams if you need more depth.

---

## 3. Working Locally
### If You Use WebStorm
1. Open the folder, let the IDE install npm packages.
2. Run the predefined `npm start`/`npm test` configurations or use the built-in Prisma database panel.

### If You Prefer The Terminal (no IDE required)
```bash
npm install
cp .env.example .env            # fill DATABASE_URL, JWT secrets, mail creds, etc.
npm run db:generate             # Prisma client
npm run db:migrate              # applies migrations to your local DB
npm run db:seed                 # optional admin/patient demo user
npm run start:dev               # watches files on localhost:3000
npm run test && npm run lint    # before pushing
docker compose up --build       # full stack (API + Postgres + pgAdmin + backups)
```
- Use `npx prisma studio` for a GUI, or `psql` with the same `DATABASE_URL`.
- Swagger lives at `http://localhost:3000/docs`.

---

## 4. Deploying With `scripts/full-deploy.sh`
This script builds the Docker image, pushes it to ECR, and triggers the remote `/opt/weightloss/deploy.sh` via AWS SSM.

### Prerequisites
- Docker CLI installed and running.
- AWS CLI v2 installed, with a named profile that has ECR + SSM access.
- Logged in to the repo with the latest code and migrations committed.

### Happy Path Command
```bash
./scripts/full-deploy.sh --migrate --seed-groupon-tests --smoke
```
1. Build/tag image as `weight-loss-clinic-api:<git-hash>` and optionally `:latest`.
2. Push to `851725402279.dkr.ecr.us-east-1.amazonaws.com/weight-loss-clinic-api`.
3. Run `deploy.sh migrate` on the EC2 host (migrates DB, restarts container).
4. Seed QA Groupon vouchers and hit `/health`, `/ready`, `/v1/products/categories`.

### Useful Flags
- `--profile clinic-prod` → use non-default AWS profile.
- `--region us-west-2` → override AWS region (defaults to `us-east-1`).
- `--tag myrelease` + `--no-latest` → deploy a specific tag without touching `:latest`.
- `--skip-build` → only trigger remote deploy (image already pushed).
- `--seed` → run the destructive Prisma seed (only for fresh DBs!).
- `--set-var KEY=VALUE` → append/update a single env var on the host.
- `--update-env --env-file prod.env` → push your local `prod.env` to `/opt/weightloss/.env`.

### Verifying After Deploy
```bash
aws ssm start-session --target i-0f9d8eab11737f436
curl -s http://localhost:3000/ready
sudo docker logs -f weightloss-api-1
```
Roll back by rerunning `deploy.sh` with the previous tag in `/opt/weightloss/docker-compose.yml`.

---

## 5. Keys, Secrets, and Where They Live

| Secret | Where it’s stored | How it’s used |
| --- | --- | --- |
| `.env` values (DATABASE_URL, JWT secrets, mail creds, MinIO creds, etc.) | Local dev: project root `.env`. Prod: `/opt/weightloss/.env` on EC2. Long-term home: AWS SSM Parameter Store under `/weightloss/prod/...`. | Nest config + Prisma rely on these at boot. Update local + SSM together to stay in sync. |
| `prod.env` | Repository file copied into prod with `--update-env`. | Source of truth for production environment variables. |
| `weight-loss-key.pem` | Stored securely on your laptop or password manager. Needed only if you must SSH directly (`ssh -i weight-loss-key.pem ec2-user@54.80.242.78`). Prefer SSM over SSH. |
| AWS CLI profile | `~/.aws/credentials` / `~/.aws/config`. | `scripts/full-deploy.sh --profile <name>` reads it to build/push/deploy. |
| Parameter Store entries | `/weightloss/prod/DATABASE_URL`, `/weightloss/prod/JWT_ACCESS_SECRET`, `/weightloss/prod/JWT_REFRESH_SECRET`, `/weightloss/prod/MAIL_*`, `/weightloss/prod/SEED_ADMIN_PASSWORD`. | Use `aws ssm get-parameter --with-decryption --name /weightloss/prod/...` to sync values or load them into CI/CD later. |

**Safe update flow**  
1. Edit `prod.env`.  
2. Run `./scripts/full-deploy.sh --update-env --env-file prod.env --profile <name>`.  
3. Mirror the same values to Parameter Store (`aws ssm put-parameter ... --overwrite`).  
4. Redeploy (`--migrate` only if schema changed).  

---

## 6. Database & Log Access (from `Commands`)

### Database (psql or GUI)
1. Forward the RDS port through SSM (keeps DB private):
   ```bash
   aws ssm start-session \
     --target i-0f9d8eab11737f436 \
     --document-name AWS-StartPortForwardingSessionToRemoteHost \
     --parameters '{"host":["weight-loss-db.cerwwea2qjz1.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5433"]}'
   ```
2. Connect locally while that session is open:
   ```bash
   psql "postgresql://weightloss_admin:TempPass123!@localhost:5433/weightloss"
   ```
3. Useful queries from `Commands` (copy/paste into psql):
   ```sql
   SELECT code,"planSlug","planWeeks","productToken"
   FROM groupon_code_catalog
   WHERE code = '3HRUK6ZBV6SR';

   SELECT *
   FROM groupon_vouchers
   WHERE "redemptionCode" = 'CWXW2GB3VQW2';
   ```

### CloudWatch Logs
```bash
START=$(( $(date -u +%s) - 86400 ))
END=$(date -u +%s)

QUERY='fields @timestamp, event, redemptionCode, requestId, status, redeemedAt, reason, url
| filter ispresent(event)
| filter redemptionCode = "39RRT2EZZQWB"
| sort @timestamp asc'

QID=$(aws logs start-query \
  --log-group-name /weightloss/api \
  --start-time "$START" \
  --end-time "$END" \
  --query-string "$QUERY" \
  --query queryId --output text)

sleep 2
aws logs get-query-results --query-id "$QID"
```
Change the `redemptionCode` filter or add more fields to inspect other events.

---

## 7. Other Helpful Scripts & Runbooks
- `scripts/seed-admin-users.ts`, `scripts/seed-groupon-test-codes.ts`, `scripts/sync-patient-status.ts`: targeted maintenance tasks runnable via `npx ts-node -r tsconfig-paths/register <script>`.
- `docs/runbooks/*.md`: password resets, unlock user, refresh rotation, admin access.
- `DEPLOYMENT_RUNBOOK.txt`: exhaustive AWS setup reference if you ever need to rebuild the stack.
- `docs/monitoring.md` + `docs/security.md`: guidelines for alerts and security posture.

---

## 8. Common Troubleshooting (quick answers)
- **App unhealthy after deploy** → `aws ssm start-session`, run `sudo docker ps` and `sudo docker logs -f weightloss-api-1`.
- **DB migrations fail** → rerun deploy with `--migrate`, inspect Prisma SQL under `prisma/migrations`.
- **Images broken** → verify MinIO container on EC2 (`sudo docker ps | grep minio`) and confirm `OBJECT_STORAGE_*` values match reality.
- **Need HTTPS cert** → `sudo certbot --nginx -d api.joeymed.com` (already set up, rerun if IP changes).

---

## 9. Hand-off Checklist
1. Be comfortable running local dev commands from the terminal (section 3).
2. Know how to push a release with `scripts/full-deploy.sh` and the `--profile` flag.
3. Keep secrets aligned between `prod.env`, `/opt/weightloss/.env`, and Parameter Store.
4. Use the `Commands` snippets to debug DB rows or CloudWatch logs quickly.
5. When in doubt, read `DEPLOYMENT_RUNBOOK.txt`—it contains every AWS command ever used.

You now have everything needed to keep the Weight Loss Clinic backend healthy. Reach out to the original maintainer if anything here drifts from reality, and update this handover as you learn more.
