import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import {
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ReorderChecklistDto,
} from './dto/checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChecklistTemplateService } from './checklist-template.service';

@Controller('checklist')
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(
    private readonly checklistService: ChecklistService,
    private readonly checklistTemplateService: ChecklistTemplateService,
  ) {}

  @Get(':taskId')
  getChecklist(@Param('taskId') taskId: string) {
    return this.checklistService.getChecklistByTaskId(taskId);
  }

  @Post(':taskId/items')
  createChecklistItem(@Param('taskId') taskId: string, @Body() dto: CreateChecklistItemDto) {
    return this.checklistService.createChecklistItem(taskId, dto);
  }

  @Post(':taskId/items/bulk')
  createManyChecklistItems(@Param('taskId') taskId: string, @Body() items: CreateChecklistItemDto[]) {
    return this.checklistService.createManyChecklistItems(taskId, items);
  }

  @Post(':taskId/apply-template')
  applyTemplate(@Param('taskId') taskId: string, @Body() body: { templateId: string }) {
    return this.checklistTemplateService.applyTemplateToTask(body.templateId, taskId);
  }

  @Patch(':id')
  updateChecklistItem(@Param('id') id: string, @Body() dto: UpdateChecklistItemDto) {
    return this.checklistService.updateChecklistItem(id, dto);
  }

  @Delete(':id')
  deleteChecklistItem(@Param('id') id: string) {
    return this.checklistService.deleteChecklistItem(id);
  }

  @Post(':taskId/reorder')
  reorderChecklist(@Param('taskId') taskId: string, @Body() dto: ReorderChecklistDto) {
    return this.checklistService.reorderChecklist(taskId, dto.itemIds);
  }
}
