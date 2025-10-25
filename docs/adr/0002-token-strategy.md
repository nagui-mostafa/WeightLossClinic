# ADR 0002 — Token Strategy & Session Management

## Status

Accepted — 2025-10-24

## Context

Authentication must support:
- Browser and native clients.
- Short-lived access tokens for APIs.
- Long-lived refresh tokens with rotation & revocation.
- Logout and password reset should invalidate active sessions.

Strategies considered:

1. **Opaque session IDs (Redis-backed)**  
   + Strong control, server-side revocation.  
   − Additional infrastructure (Redis), less stateless.

2. **Self-contained JWT without rotation**  
   + Simplicity.  
   − Harder to revoke, vulnerable to theft.

3. **JWT access token + hashed refresh session store**  
   + Stateless API requests.  
   + Refresh session revocation chain.  
   + Detailed metadata for security analytics.  
   − Requires DB table for refresh sessions.

## Decision

Adopt **JWT access tokens (short TTL) + rotating refresh tokens stored hashed in PostgreSQL**.

- Access token: 15 minutes, signed with `JWT_ACCESS_SECRET`, includes `sub`, `role`, `sid`.
- Refresh token: 7–30 days, rotates on every use, hashed via Argon2 and persisted with metadata.
- Session reuse triggers cascade revocation and audit log entries.

## Consequences

### Advantages

- Stateless API while maintaining revocation control.
- Supports HTTP-only cookies or native body transport.
- Simple to reason about, minimal external dependencies.
- Audit log integration allows tracing suspicious activity.

### Trade-offs

- Slight complexity in rotation logic and detection, tested via unit/integration tests.
- Writes on every refresh (update session + new record) — acceptable throughput for clinic workload.
- Requires careful handling in multi-device scenarios (addressed by per-session metadata).

This approach balances user experience, security, and operational simplicity for the clinic backend.
