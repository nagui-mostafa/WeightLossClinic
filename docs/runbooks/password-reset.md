# Runbook: Force Password Reset

## When to Use

- User reports account compromise.
- Security detects credential leakage.
- Admin wants to invalidate all active sessions for a user.

## Preconditions

- Logged-in admin with `Role.ADMIN`.
- User account is active and identifiable by email or UUID.

## Steps

1. **Locate User**
   ```sql
   SELECT id, email, is_active FROM users WHERE email = lower($1);
   ```
2. **Trigger Reset Token**
   - Call `POST /auth/forgot-password` with the user email.
   - If mail transport is disabled, retrieve token from application logs.
3. **Invalidate Sessions**
   ```ts
   await sessionsService.revokeAllUserSessions(userId, 'forced-password-reset');
   await passwordResetService.invalidateUserTokens(userId);
   ```
4. **Communicate**
   - Send reset link to user (via transactional email).
   - Include instructions on choosing a strong password.
5. **Verify Completion**
   - Monitor audit logs for `PASSWORD_RESET_COMPLETED`.
   - Confirm new login with admin or user (optional).

## Post-Incident

- Document incident in ticketing system.
- Review audit logs for suspicious activity preceding reset.
- Consider enabling mandatory email verification if not already active.
