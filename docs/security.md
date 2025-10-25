# Security Policy & Controls

## Password & Token Policy

- Passwords hashed using Argon2id with:
  - Memory cost: 64 MiB
  - Time cost: 4
  - Parallelism: 2
- Minimum password complexity enforced via DTO validation:
  - ≥ 12 characters, at least one uppercase, lowercase, digit, special char.
- Access token TTL: default 15 minutes (`ACCESS_TOKEN_TTL`).
- Refresh token TTL: default 14 days (`REFRESH_TOKEN_TTL`).
- Password reset tokens: 15 minutes (`PASSWORD_RESET_TOKEN_TTL`).
- Email verification tokens: 24 hours (`EMAIL_VERIFICATION_TOKEN_TTL`).

## Session Management

- Refresh tokens rotated on every use, stored hashed in `refresh_sessions`.
- Reuse detection triggers cascade revocation of active sessions for the user.
- Logout revokes current refresh session only.
- Password reset flow invalidates all refresh sessions + outstanding reset tokens.

## Input & Output Validation

- DTO validation via `class-validator` with `whitelist` + `forbidNonWhitelisted`.
- Route parameter parsing handled by Nest pipes, with type conversion enabled.
- Swagger documentation enumerates responses; error format normalized via `HttpExceptionFilter`.

## Transport Security

- Helmet middleware enabled (`helmet()`).
- CORS origins configurable via `CORS_ORIGINS`.
- Cookies are not used by default (HTTP-only refresh cookies recommended for production clients).
- Terminate TLS at load balancer or edge proxy.

## Audit & Monitoring

- Actions recorded in `audit_logs` table with actor, target, metadata, IP, UA.
- Admin endpoints require `Role.ADMIN` guard.
- Structured logs shipped via Pino; configure log sink (ELK, CloudWatch, etc.).

## Secrets Management

- Load secrets from environment variables or secret manager (Vault, AWS Secrets Manager).
- `.env.example` provided for local development only; never commit `.env`.
- Rotate JWT secrets and mail credentials regularly.

## Data Protection & Privacy

- Access checks ensure patients can only manage their own records.
- Admin actions (role change, deactivate, reset) audited.
- Phone number optional; stored unique if provided.
- Use PG encryption at rest and TLS in transit (managed by infrastructure).
- For account deletion/anonymization policies, extend user deletion handler to scrub PII.

## Incident Response

1. **Suspected credential compromise**
   - Trigger password reset runbook (`docs/runbooks/password-reset.md`).
   - Revoke refresh sessions (`SessionsService.revokeAllUserSessions`).
2. **Refresh token misuse**
   - Review audit logs filtered by `REFRESH_TOKEN_REVOKED`.
   - Lock user account (`UsersService.updateStatus`).
   - Notify security stakeholders.
3. **Unauthorized admin action**
   - Inspect `audit_logs` by actor, confirm IP/user-agent.
   - Force password reset + review access provisioning.

## Hardening Checklist

- [ ] Run behind trusted reverse proxy (e.g., Nginx, API gateway).
- [ ] Configure TLS certificates (Let’s Encrypt, ACM).
- [ ] Enable structured log export to SIEM.
- [ ] Add WAF / Bot protection as needed.
- [ ] Schedule regular dependency upgrades via Dependabot.
- [ ] Implement backup verification for Postgres dumps.
