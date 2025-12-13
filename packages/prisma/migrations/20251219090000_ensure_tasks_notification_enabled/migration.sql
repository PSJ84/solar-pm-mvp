-- Ensure tasks.notificationEnabled exists on deployments where migrate deploy was skipped
ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS "notificationEnabled" BOOLEAN;

ALTER TABLE "tasks"
ALTER COLUMN "notificationEnabled" SET DEFAULT false;

UPDATE "tasks"
SET "notificationEnabled" = false
WHERE "notificationEnabled" IS NULL;

ALTER TABLE "tasks"
ALTER COLUMN "notificationEnabled" SET NOT NULL;
