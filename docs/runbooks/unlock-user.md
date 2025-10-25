# Runbook: Unlock / Reactivate User

## Purpose

Re-enable a user account that was deactivated due to inactivity, suspected compromise, or manual admin action.

## Preconditions

- Admin privileges (`Role.ADMIN`).
- Root cause for deactivation understood and mitigated.

## Steps

1. **Confirm Current Status**
   ```sql
   SELECT id, email, is_active, updated_at
   FROM users
   WHERE email = lower($1);
   ```
2. **Reactivate**
   ```http
   PATCH /users/:id/status
   Content-Type: application/json
   Authorization: Bearer <admin-access-token>

   {
     "isActive": true
   }
   ```
3. **Force Credential Hygiene (optional)**
   - Call password reset runbook if compromise suspected.
   - Reset MFA or recovery tokens if implemented.
4. **Notify User**
   - Communicate unlock action and ask user to login again.
   - Remind about security best practices.
5. **Audit Verification**
   - Ensure an `USER_ACTIVATED` entry exists in audit logs.
   - Keep ticket/incident updated with timestamp & actor.

## Escalation

If repeated lockouts occur, escalate to security team for thorough investigation and potential IP blocking.
