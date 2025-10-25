# Weight Loss Clinic API

Secure, production-ready REST backend for managing patients, medication plans, and clinical operations for a weight loss clinic. Built with NestJS, PostgreSQL (via Prisma), JWT session rotation, structured logging, metrics, and a full operational toolchain (runbooks, ADRs, Docker, CI).

## ✨ Highlights

- **Authentication & Sessions**
  - Patient self-signup with optional email verification
  - Admin-managed users & role changes
  - JWT access (15m) + rotating refresh tokens (14d) with reuse detection
  - Password reset flows with email links and forced session revocation
- **Clinical Records**
  - Patients manage their own medication records
  - Admins can audit, filter, and manage all records
- **Admin & Compliance**
  - Audit logging for all sensitive actions
  - System stats dashboard endpoints
  - Runbooks for critical operations (`docs/runbooks`)
- **Operational Excellence**
  - Structured logging (Pino), request correlation IDs
  - Health & readiness probes, aggregate metrics endpoint
  - Docker Compose (app + Postgres + pgAdmin + automated backups)
  - GitHub Actions CI workflow (lint, build, test)

## 🗃️ Project Structure

```
src/
  main.ts               # App bootstrap, security, Swagger
  app.controller.ts     # Root info endpoint
  modules/
    auth/               # Auth flows, guards, tokens, mail triggers
    users/              # Admin & patient profile management
    records/            # Medication record CRUD + filtering
    admin/              # Audit logs & statistics
    common/             # Shared guards, interceptors, Prisma, utils
    config/             # Environment validation + configuration
    mail/               # SMTP + templated messages/fallback logging
    health/             # Liveness, readiness, metrics
prisma/                 # Schema, migrations, seed script
docs/                   # Architecture notes, ADRs, runbooks, policies
docker-compose.yml      # Local infra stack
Dockerfile              # Multi-stage production build
.github/workflows/ci.yml# CI pipeline
```

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Provide environment variables

Copy the sample and adjust as needed.

```bash
cp .env.example .env
```

At minimum set:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- Mail credentials if sending real emails

### 3. Database

#### Option A – Dockerized PostgreSQL (recommended)

```bash
# 1. Launch Postgres container
docker run --name wlc-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=weight_loss_clinic \
  -p 5432:5432 \
  -d postgres:15-alpine

# 2. Confirm it is running
docker ps
docker logs wlc-postgres

# 3. Generate Prisma client & run migrations
npm run db:generate
npm run db:migrate

# 4. Seed default admin (creates admin@weightlossclinic.com / ChangeMeNow!123)
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/weight_loss_clinic
export JWT_ACCESS_SECRET=change-me
export JWT_REFRESH_SECRET=change-me-again
npm run db:seed

# 5. Inspect tables
psql "postgresql://postgres:postgres@localhost:5432/weight_loss_clinic" -c "\dt"
```

You can browse data visually with Prisma Studio:

```bash
npx prisma studio
```

#### Option B – Existing/local Postgres

Point `DATABASE_URL` to your instance, then:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed   # optional admin bootstrap
```

### 4. Run locally

```bash
# Development with watch mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Swagger docs available at `http://localhost:3000/docs` (protected in production via the `NODE_ENV` flag).

## 🧪 Testing

```bash
# Unit tests
npm run test

# e2e smoke tests
npm run test:e2e

# Coverage (unit)
npm run test:cov
```

## 🐳 Dockerized Environment

```bash
docker compose up --build
```

Services:

- `api` – NestJS application (hot reload via bind mount)
- `postgres` – PostgreSQL 15 with persistent volume
- `pgadmin` – Optional GUI (http://localhost:5050)
- `pgbackup` – Scheduled `pg_dump` backups (mounted at `./backups`)

See `docker-compose.yml` for credentials and volumes.

## 🔑 Important Commands

| Purpose                  | Command                                      |
| ------------------------ | -------------------------------------------- |
| Lint                     | `npm run lint`                               |
| Build                    | `npm run build`                              |
| Prisma migration (dev)   | `npm run db:dev`                             |
| Prisma migration deploy  | `npm run db:migrate`                         |
| Generate Prisma client   | `npm run db:generate`                        |
| Seed admin user          | `npm run db:seed`                            |
| Format code              | `npm run format`                             |

## 📚 Documentation & Runbooks

- `docs/architecture.md` – high-level design
- `docs/monitoring.md` – metrics & observability
- `docs/security.md` – password policies, token TTLs, incident guidance
- `docs/runbooks/`
  - `password-reset.md` – forced reset procedure
  - `unlock-user.md` – reactivating & auditing locked accounts
  - `refresh-rotation.md` – handling refresh token misuse
- `docs/adr/`
  - `0001-orm.md` – Prisma vs TypeORM decision
  - `0002-token-strategy.md` – JWT rotation rationale

## 🖥️ Frontend Companion App

A React/Vite frontend that consumes every backend endpoint lives in [`frontend/`](frontend/README.md). It ships with polished dashboards for patients and admins, including signup, login, email verification, password resets, record management, audit log browsing, and analytics.

Quick start:

```bash
cd frontend
npm install
cp .env.example .env   # adjust VITE_API_URL if the backend runs elsewhere
npm run dev            # launches http://localhost:5173 with hot reload
```

## 🔒 Security Highlights

- Argon2id password hashing with elevated cost
- Input validation (`class-validator`) & output filtering
- JWT rotation with reuse detection + cascading revocation
- Structured audit logging for privileged actions
- Helmet, strict CORS, and rate limiting out of the box

## 🛠️ Tooling & CI/CD

- GitHub Actions workflow (`.github/workflows/ci.yml`) for lint → build → test
- Pino logging with correlation IDs (`X-Request-Id`)
- Metrics endpoint (`/metrics`) for Prometheus scraping
- Health (`/health`) & readiness (`/ready`) checks for orchestrators

## 🙋 Support & Contributions

Contributions are welcome! Please follow the established lint/test workflow (`npm run lint && npm run test`) before opening a PR.

For questions or incidents, consult the runbooks in `docs/runbooks` or reach out to the project maintainers.

---

© 2025 Weight Loss Clinic – All rights reserved.
