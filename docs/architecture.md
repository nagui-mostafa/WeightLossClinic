# Architecture Overview

## Context

Weight Loss Clinic API is a NestJS monolith designed to provide a secure backend for managing patient profiles, medication schedules, and administrative workflows. The system is stateless, horizontally scalable, and integrates strongly with PostgreSQL for persistence.

## High-Level Diagram

```
[ Client Apps ]
      |
      v
 [ API Gateway / CDN ]
      |
      v
┌─────────────────────────────┐
│  NestJS Application         │
│                             │
│  Modules:                   │
│   • config                  │
│   • common                  │
│   • auth                    │
│   • users                   │
│   • records                 │
│   • admin                   │
│   • mail                    │
│   • health                  │
└─────────────────────────────┘
      |
      v
┌─────────────────────────────┐
│ PostgreSQL (Prisma)         │
│  • Users                    │
│  • Records                  │
│  • Refresh sessions         │
│  • Tokens (reset/email)     │
│  • Audit logs               │
└─────────────────────────────┘
      |
      v
┌─────────────────────────────┐
│ External Services           │
│  • SMTP (SendGrid, etc.)    │
│  • Observability stack      │
└─────────────────────────────┘
```

## Module Responsibilities

| Module  | Responsibilities |
|---------|------------------|
| `config` | Loads and validates environment variables using Joi, exposes typed configuration. |
| `common` | Shared services (Prisma, password hashing, metrics), interceptors, guards, decorators, DTOs. |
| `auth`   | Sign-up, login, logout, refresh rotation, password reset, email verification, request guards. |
| `users`  | Patient profile management, admin-level CRUD, role/status updates, pagination/filtering. |
| `records`| Medication record CRUD, patient-only access controls, admin overrides, filtering. |
| `admin`  | Audit log search, systems stats (user/record growth), read-only operations. |
| `mail`   | SMTP transport configuration, templated transactional emails with logging fallbacks. |
| `health` | Liveness/readiness checks, metrics aggregation. |

## Data Model (Simplified)

```
User (id, role, contact, weight metrics, status, timestamps)
  ├─< Record (medication schedules)
  ├─< RefreshSession (rotating tokens)
  ├─< PasswordResetToken
  ├─< EmailVerificationToken
  └─< AuditLog (actor or target)
```

## Authentication Strategy

- Access token: short-lived JWT (15 minutes) signed with `JWT_ACCESS_SECRET`.
- Refresh token: long-lived JWT (7–30 days) signed with `JWT_REFRESH_SECRET`, stored hashed in DB with rotation metadata.
- Refresh rotation: on reuse detection the entire session chain is revoked.
- Password reset & email verification tokens are single-use, argon2 hashed.

## Observability

- **Logging**: Pino + `nestjs-pino` with request-scoped correlation IDs and PII redaction.
- **Metrics**: Lightweight in-memory counters served at `/metrics` (Prometheus format).
- **Health**: `/health` (liveness) & `/ready` (database connectivity).
- **Audit**: Database-backed audit log for privileged actions (admin/patient).

## Deployment

- Containerized via multi-stage Dockerfile.
- `docker-compose.yml` spins up the API, PostgreSQL, pgAdmin, and automated backups.
- CI (GitHub Actions) enforces lint → build → test pipeline.

## Security Controls

- Argon2id password hashing.
- DTO validation + response whitelisting.
- Rate limiting (global `@nestjs/throttler`).
- Helmet + strict CORS.
- Role-based guards + ownership checks.
- Secrets sourced from environment / secret stores.
- Audit logging of admin actions.

## Extension Points

- Add external identity providers via Passport strategies.
- Integrate Sentry/OTel by extending `common` module.
- Expand notification channels (SMS/push) by adding service in `mail` module.

## Known Limitations

- Metrics service aggregates in-memory; replace with Prometheus client in long-running deployments.
- Sample seed script creates a single admin – integrate with formal IAM if required.
- Email templates are simple HTML strings; consider templating engine for richer content.
