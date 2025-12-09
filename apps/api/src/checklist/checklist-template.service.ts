import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddTemplateItemDto,
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
} from './dto/checklist-template.dto';

@Injectable()
export class ChecklistTemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.checklistTemplate.findMany({
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return template;
  }

  async create(dto: CreateChecklistTemplateDto) {
    return this.prisma.checklistTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        items: dto.items
          ? {
              create: dto.items.map((item, index) => ({
                title: item.title,
                order: item.order ?? index,
                hasExpiry: item.hasExpiry ?? false,
              })),
            }
          : undefined,
      },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateChecklistTemplateDto) {
    const existing = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return this.prisma.checklistTemplate.update({
      where: { id },
      data: dto,
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.checklistTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return this.prisma.checklistTemplate.delete({ where: { id } });
  }

  async addItem(templateId: string, dto: AddTemplateItemDto) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    const maxOrder = await this.prisma.checklistTemplateItem.aggregate({
      where: { templateId },
      _max: { order: true },
    });

    return this.prisma.checklistTemplateItem.create({
      data: {
        templateId,
        title: dto.title,
        hasExpiry: dto.hasExpiry ?? false,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
  }

  async updateItem(itemId: string, dto: AddTemplateItemDto) {
    const existing = await this.prisma.checklistTemplateItem.findUnique({ where: { id: itemId } });
    if (!existing) {
      throw new NotFoundException('템플릿 아이템을 찾을 수 없습니다.');
    }

    return this.prisma.checklistTemplateItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async deleteItem(itemId: string) {
    const existing = await this.prisma.checklistTemplateItem.findUnique({ where: { id: itemId } });
    if (!existing) {
      throw new NotFoundException('템플릿 아이템을 찾을 수 없습니다.');
    }

    return this.prisma.checklistTemplateItem.delete({ where: { id: itemId } });
  }

  async reorderItems(templateId: string, itemIds: string[]) {
    const updates = itemIds.map((id, index) =>
      this.prisma.checklistTemplateItem.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findOne(templateId);
  }

  async applyTemplateToTask(templateId: string, taskId: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('태스크를 찾을 수 없습니다.');
    }

    const maxOrder = await this.prisma.checklistItem.aggregate({
      where: { taskId },
      _max: { order: true },
    });
    const startOrder = (maxOrder._max.order ?? -1) + 1;

    const createData = template.items.map((item, index) => ({
      taskId,
      title: item.title,
      status: 'pending',
      order: startOrder + index,
    }));

    await this.prisma.checklistItem.createMany({ data: createData });

    const checklistItems = await this.prisma.checklistItem.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
    });

    return {
      applied: template.items.length,
      total: checklistItems.length,
      items: checklistItems,
    };
  }
}
