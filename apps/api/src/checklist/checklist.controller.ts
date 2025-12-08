import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import {
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ReorderChecklistDto,
} from './dto/checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get('tasks/:taskId/checklist')
  getChecklist(@Param('taskId') taskId: string) {
    return this.checklistService.getChecklistByTaskId(taskId);
  }

  @Post('tasks/:taskId/checklist')
  createChecklistItem(@Param('taskId') taskId: string, @Body() dto: CreateChecklistItemDto) {
    return this.checklistService.createChecklistItem(taskId, dto);
  }

  @Post('tasks/:taskId/checklist/bulk')
  createManyChecklistItems(@Param('taskId') taskId: string, @Body() items: CreateChecklistItemDto[]) {
    return this.checklistService.createManyChecklistItems(taskId, items);
  }

  @Patch('checklist/:id')
  updateChecklistItem(@Param('id') id: string, @Body() dto: UpdateChecklistItemDto) {
    return this.checklistService.updateChecklistItem(id, dto);
  }

  @Delete('checklist/:id')
  deleteChecklistItem(@Param('id') id: string) {
    return this.checklistService.deleteChecklistItem(id);
  }

  @Patch('tasks/:taskId/checklist/reorder')
  reorderChecklist(@Param('taskId') taskId: string, @Body() dto: ReorderChecklistDto) {
    return this.checklistService.reorderChecklist(taskId, dto.itemIds);
  }
}
