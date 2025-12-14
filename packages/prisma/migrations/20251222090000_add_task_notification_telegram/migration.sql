-- Ensure notification fields exist for Telegram alerts
ALTER TABLE "tasks"
    ADD COLUMN IF NOT EXISTS "notificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "lastNotifiedAt" TIMESTAMP(3);
