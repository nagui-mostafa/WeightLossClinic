-- Create enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PATIENT');
CREATE TYPE "MedicationType" AS ENUM ('INJECTABLE', 'ORAL', 'TOPICAL', 'OTHER');
CREATE TYPE "AuditAction" AS ENUM (
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ROLE_CHANGED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_DELETED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'EMAIL_VERIFIED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'REFRESH_TOKEN_ROTATED',
  'REFRESH_TOKEN_REVOKED'
);

-- Users table
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'PATIENT',
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "phone" TEXT UNIQUE,
  "weightLoss" NUMERIC(5,2),
  "weightDose" NUMERIC(6,2),
  "currentWeight" NUMERIC(5,2),
  "goalWeight" NUMERIC(5,2),
  "isEmailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_is_active_idx" ON "users"("isActive");

-- Records table
CREATE TABLE "records" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "medicationName" VARCHAR(200) NOT NULL,
  "medicationType" "MedicationType" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "records_user_start_idx" ON "records"("userId", "startDate");
CREATE INDEX "records_medication_type_idx" ON "records"("medicationType");

-- Refresh sessions
CREATE TABLE "refresh_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "userAgent" TEXT,
  "ip" TEXT,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "refresh_sessions_expires_idx" ON "refresh_sessions"("expiresAt");
CREATE INDEX "refresh_sessions_user_idx" ON "refresh_sessions"("userId");

-- Password reset tokens
CREATE TABLE "password_reset_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "password_reset_tokens_expires_idx" ON "password_reset_tokens"("expiresAt");

-- Email verification tokens
CREATE TABLE "email_verification_tokens" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "email_verification_tokens_expires_idx" ON "email_verification_tokens"("expiresAt");

-- Audit logs
CREATE TABLE "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "targetUserId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "action" "AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "audit_logs_created_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs"("actorUserId");
