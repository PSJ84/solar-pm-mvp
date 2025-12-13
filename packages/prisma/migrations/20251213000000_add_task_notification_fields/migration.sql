-- Add task notification settings fields
ALTER TABLE "tasks"
    ADD COLUMN "notificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "reminderIntervalMin" INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN "lastNotifiedAt" TIMESTAMP(3);
