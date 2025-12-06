// apps/api/src/stages/stages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStageDatesDto } from './dto/update-stage-dates.dto';
import { UpdateStageActiveDto } from './dto/update-stage-active.dto';

@Injectable()
export class StagesService {
  constructor(private prisma: PrismaService) {}

  private parseDateValue(value?: string | null) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return new Date(value);
  }

  async findOne(id: string) {
    const stage = await this.prisma.projectStage.findFirst({
      where: { id, deletedAt: null },
      include: {
        tasks: { where: { deletedAt: null, isActive: true } },
      },
    });

    if (!stage) {
      throw new NotFoundException('프로젝트 단계를 찾을 수 없습니다.');
    }

    return stage;
  }

  async updateDates(id: string, dto: UpdateStageDatesDto) {
    await this.findOne(id);

    return this.prisma.projectStage.update({
      where: { id },
      data: {
        startDate: this.parseDateValue(dto.startDate),
        receivedDate: this.parseDateValue(dto.receivedDate),
        completedDate: this.parseDateValue(dto.completedDate),
      },
    });
  }

  async updateActive(id: string, dto: UpdateStageActiveDto) {
    const stage = await this.prisma.projectStage.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, projectId: true },
    });

    if (!stage) {
      throw new NotFoundException('프로젝트 단계를 찾을 수 없습니다.');
    }

    const updated = await this.prisma.projectStage.update({
      where: { id },
      data: { isActive: dto.isActive },
    });

    await this.updateStageStatus(id);

    await this.prisma.project.update({
      where: { id: stage.projectId },
      data: { updatedAt: new Date() },
    });

    return updated;
  }

  private async updateStageStatus(projectStageId: string) {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: projectStageId },
      include: { tasks: { where: { deletedAt: null, isActive: true } } },
    });

    if (!stage) return;
    if (stage.isActive === false) return;

    const tasks = stage.tasks || [];
    let derivedStatus = 'pending';

    if (tasks.length > 0) {
      const completedCount = tasks.filter((t) => t.status === 'completed').length;
      const hasInProgress = tasks.some((t) => t.status === 'in_progress');

      if (completedCount === tasks.length) {
        derivedStatus = 'completed';
      } else if (hasInProgress || completedCount > 0) {
        derivedStatus = 'active';
      } else {
        derivedStatus = 'pending';
      }
    }

    if (derivedStatus !== stage.status) {
      await this.prisma.projectStage.update({
        where: { id: projectStageId },
        data: { status: derivedStatus },
      });
    }
  }
}
