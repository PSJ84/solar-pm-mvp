-- users.fcmToken (nullable)
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "fcmToken" TEXT;

-- tasks.notificationEnabled (not null default false)
ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS "notificationEnabled" BOOLEAN NOT NULL DEFAULT false;
