import { Module } from '@nestjs/common';
import { ChecklistController } from './checklist.controller';
import { ChecklistService } from './checklist.service';
import { ChecklistTemplateController } from './checklist-template.controller';
import { ChecklistTemplateService } from './checklist-template.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChecklistController, ChecklistTemplateController],
  providers: [ChecklistService, ChecklistTemplateService],
  exports: [ChecklistService, ChecklistTemplateService],
})
export class ChecklistModule {}