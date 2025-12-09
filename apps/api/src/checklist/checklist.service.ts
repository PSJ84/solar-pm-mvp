import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto';

@Injectable()
export class ChecklistService {
  constructor(private prisma: PrismaService) {}

  async ensureTaskExists(taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('태스크를 찾을 수 없습니다.');
    }
    return task;
  }

  async getChecklistByTaskId(taskId: string) {
    await this.ensureTaskExists(taskId);

    const items = await this.prisma.checklistItem.findMany({
      where: { taskId },
      orderBy: { order: 'asc' },
    });

    const total = items.length;
    const completed = items.filter((item) => item.status === 'completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      items,
      summary: {
        total,
        completed,
        progress,
      },
    };
  }

  async createChecklistItem(taskId: string, dto: CreateChecklistItemDto) {
    await this.ensureTaskExists(taskId);

    const maxOrder = await this.prisma.checklistItem.aggregate({
      where: { taskId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.checklistItem.create({
      data: {
        taskId,
        title: dto.title,
        status: dto.status ?? 'pending',
        memo: dto.memo,
        order: dto.order ?? nextOrder,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        fileUrl: undefined,
        fileName: undefined,
      },
    });
  }

  async updateChecklistItem(id: string, dto: UpdateChecklistItemDto) {
    const item = await this.prisma.checklistItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('체크리스트 아이템을 찾을 수 없습니다.');
    }

    return this.prisma.checklistItem.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        status: dto.status ?? undefined,
        memo: dto.memo ?? undefined,
        order: dto.order ?? undefined,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        fileUrl: dto.fileUrl ?? undefined,
        fileName: dto.fileName ?? undefined,
      },
    });
  }

  async deleteChecklistItem(id: string) {
    const item = await this.prisma.checklistItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('체크리스트 아이템을 찾을 수 없습니다.');
    }

    return this.prisma.checklistItem.delete({ where: { id } });
  }

  async reorderChecklist(taskId: string, itemIds: string[]) {
    await this.ensureTaskExists(taskId);

    const tx = itemIds.map((id, index) =>
      this.prisma.checklistItem.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(tx);

    return this.getChecklistByTaskId(taskId);
  }

  async createManyChecklistItems(taskId: string, items: CreateChecklistItemDto[]) {
    await this.ensureTaskExists(taskId);

    const maxOrder = await this.prisma.checklistItem.aggregate({
      where: { taskId },
      _max: { order: true },
    });
    let nextOrder = (maxOrder._max.order ?? -1) + 1;

    const data = items.map((item, index) => ({
      taskId,
      title: item.title,
      status: item.status ?? 'pending',
      memo: item.memo,
      order: nextOrder + index,
      issuedAt: item.issuedAt ? new Date(item.issuedAt) : null,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
    }));

    await this.prisma.checklistItem.createMany({ data });
    return this.getChecklistByTaskId(taskId);
  }
}
