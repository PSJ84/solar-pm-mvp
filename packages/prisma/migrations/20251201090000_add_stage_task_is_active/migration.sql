-- AlterTable
ALTER TABLE "stage_templates" ADD COLUMN "isDefaultActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "task_templates" ADD COLUMN "isDefaultActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "project_stages" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tasks" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
