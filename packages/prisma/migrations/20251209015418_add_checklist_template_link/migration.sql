-- AlterTable
ALTER TABLE "task_templates" ADD COLUMN     "checklistTemplateId" TEXT;

-- CreateIndex
CREATE INDEX "task_templates_checklistTemplateId_idx" ON "task_templates"("checklistTemplateId");

-- AddForeignKey
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
