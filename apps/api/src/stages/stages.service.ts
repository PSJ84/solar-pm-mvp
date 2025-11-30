// apps/api/src/stages/stages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStageDatesDto } from './dto/update-stage-dates.dto';

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
}
