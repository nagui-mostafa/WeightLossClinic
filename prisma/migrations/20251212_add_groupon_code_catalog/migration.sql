-- Create catalog table for static Groupon codes
CREATE TABLE IF NOT EXISTS "groupon_code_catalog" (
    "code"              VARCHAR(120) PRIMARY KEY,
    "planSlug"          VARCHAR(100) NOT NULL,
    "productToken"      VARCHAR(100),
    "planWeeks"         INTEGER,
    "dealName"          VARCHAR(255),
    "importedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "groupon_code_catalog_plan_slug_idx"
    ON "groupon_code_catalog" ("planSlug");
