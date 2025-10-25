# Runbook: Handle Refresh Token Reuse

## Trigger

- `AuditAction.REFRESH_TOKEN_REVOKED` entries with metadata `reason = "refresh-token-reuse"`.
- Security alert from monitoring when reuse detected.

## Objective

Investigate potential credential theft and secure the affected account.

## Steps

1. **Identify User & Session**
   ```sql
   SELECT al.created_at, al.actoruserid, al.metadata
   FROM audit_logs al
   WHERE al.action = 'REFRESH_TOKEN_REVOKED'
     AND al.metadata ->> 'reason' = 'refresh-token-reuse'
   ORDER BY al.created_at DESC;
   ```
2. **Lock Account Temporarily**
   ```http
   PATCH /users/:id/status
   {
     "isActive": false
   }
   ```
3. **Invalidate Sessions**
   - Already cascaded automatically, but confirm:
     ```ts
     await sessionsService.revokeAllUserSessions(userId, 'refresh-token-reuse');
     ```
4. **Reset Credentials**
   - Follow password reset runbook for forced reset.
5. **Forensics**
   - Review audit log metadata for IP/User-Agent anomalies.
   - Check application logs around the timestamp for suspicious activity.
   - If distributed attack suspected, add offending IPs to block list.
6. **Reactivate & Notify**
   - Once secure, reactivate account and inform user.
   - Encourage enabling MFA on relying application (if available).

## Escalation & Reporting

- If multiple accounts affected within short window, declare security incident.
- Notify legal/compliance teams if user data exposure is likely.
