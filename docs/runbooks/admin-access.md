# Runbook: Provision Emergency Admin Access

## Purpose

Create or recover an administrative account when no valid admin credentials are available (e.g., during onboarding or incident recovery).

## Preconditions

- Direct database access (psql) or ability to run `npm run db:seed`.
- Authorization from security/management (emergency action).

## Option A – Prisma Seed (recommended)

1. Set environment variables (temporary):
   ```bash
   export SEED_ADMIN_EMAIL=admin@example.com
   export SEED_ADMIN_PASSWORD='StrongP@ssw0rd!'
   ```
2. Run seed script:
   ```bash
   npm run db:seed
   ```
3. Login with seeded credentials and rotate password immediately.

## Option B – Manual SQL (fallback)

```sql
INSERT INTO users (email, passwordhash, role, firstname, lastname, isemailverified)
VALUES (
  lower('admin@example.com'),
  crypt('StrongP@ssw0rd!', gen_salt('bf', 12)),
  'ADMIN',
  'Emergency',
  'Admin',
  true
)
ON CONFLICT (email) DO NOTHING;
```

> Replace hashing with Argon2 via application/service if possible. The seed script already uses Argon2.

## Post-Provision Steps

1. Log in and create permanent admin account(s).
2. Document the action in the security incident log.
3. Delete or downgrade the emergency account once no longer needed.
4. Rotate any secrets exposed during the process.
