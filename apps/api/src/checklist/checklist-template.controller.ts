import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ChecklistTemplateService } from './checklist-template.service';
import {
  AddTemplateItemDto,
  CreateChecklistTemplateDto,
  ReorderTemplateItemsDto,
  UpdateChecklistTemplateDto,
} from './dto/checklist-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('checklist-templates')
@UseGuards(JwtAuthGuard)
export class ChecklistTemplateController {
  constructor(private readonly templateService: ChecklistTemplateService) {}

  @Get()
  findAll() {
    return this.templateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateChecklistTemplateDto) {
    return this.templateService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChecklistTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.templateService.delete(id);
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddTemplateItemDto) {
    return this.templateService.addItem(id, dto);
  }

  @Patch('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() dto: AddTemplateItemDto) {
    return this.templateService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string) {
    return this.templateService.deleteItem(itemId);
  }

  @Patch(':id/items/reorder')
  reorderItems(@Param('id') id: string, @Body() dto: ReorderTemplateItemsDto) {
    return this.templateService.reorderItems(id, dto.itemIds);
  }

  @Post(':id/apply/:taskId')
  applyToTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.templateService.applyTemplateToTask(id, taskId);
  }
}
