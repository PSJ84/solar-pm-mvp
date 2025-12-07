-- Add start and completion tracking to tasks
ALTER TABLE "tasks"
  ADD COLUMN "startDate" TIMESTAMPTZ,
  ADD COLUMN "completedDate" TIMESTAMPTZ;
