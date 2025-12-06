import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { StageTemplate, TaskTemplate } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type {
  TemplateDetailDto,
  TemplateListItemDto,
  StageTemplateStageDto,
  StageTemplateTaskDto,
  ProjectStageTemplateDto,
} from '@shared/types/template.types';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private toStageDto(template: StageTemplate & { taskTemplates: TaskTemplate[] }): StageTemplateStageDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      isRequired: true,
      isDefaultActive: template.isDefaultActive ?? true,
      order: template.order,
      tasks: template.taskTemplates
        .filter((task) => !task.deletedAt)
        .sort((a, b) => a.order - b.order)
        .map((task) => this.toTaskDto(task)),
    };
  }

  private toTaskDto(task: TaskTemplate): StageTemplateTaskDto {
    return {
      id: task.id,
      name: task.title,
      description: task.description ?? undefined,
      isMandatory: task.isMandatory,
      isDefaultActive: task.isDefaultActive ?? true,
      defaultDueDays: task.defaultDueDays ?? undefined,
      order: task.order,
    };
  }

  private toTemplateDetail(template: StageTemplate & { taskTemplates: TaskTemplate[] }): TemplateDetailDto {
    const stage = this.toStageDto(template);

    return {
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      isDefault: false,
      stages: [stage],
      stageCount: 1,
      taskCount: stage.tasks.length,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  private async resolveCompanyId(optionalCompanyId?: string): Promise<string> {
    if (optionalCompanyId) return optionalCompanyId;

    const fallbackCompany = await this.prisma.company.findFirst();
    if (fallbackCompany) return fallbackCompany.id;

    const company = await this.prisma.company.create({ data: { name: 'Demo Company' } });
    return company.id;
  }

  async findAll(companyId?: string): Promise<TemplateListItemDto[]> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const templates = await this.prisma.stageTemplate.findMany({
      where: { companyId: resolvedCompanyId, deletedAt: null },
      include: { taskTemplates: { where: { deletedAt: null } } },
      orderBy: { order: 'asc' },
    });

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      isDefault: false,
      stageCount: 1,
      taskCount: template.taskTemplates.length,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    }));
  }

  async findOne(id: string, companyId?: string): Promise<TemplateDetailDto> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const template = await this.prisma.stageTemplate.findFirst({
      where: { id, companyId: resolvedCompanyId, deletedAt: null },
      include: {
        taskTemplates: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return this.toTemplateDetail(template);
  }

  async updateStructure(
    id: string,
    payload: ProjectStageTemplateDto,
    companyId?: string,
  ): Promise<TemplateDetailDto> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const template = await this.prisma.stageTemplate.findFirst({
      where: { id, companyId: resolvedCompanyId, deletedAt: null },
      include: { taskTemplates: { where: { deletedAt: null } } },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    const stagePayload = payload.stages?.[0];
    if (!stagePayload) {
      throw new BadRequestException('단계 정보가 필요합니다.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 템플릿 메타 업데이트 (현재 구조에서는 stageTemplate == stage 느낌)
      await tx.stageTemplate.update({
        where: { id: template.id },
        data: {
          name: payload.name,
          description: payload.description ?? stagePayload.description ?? null,
          order: stagePayload.order ?? template.order,
          isDefaultActive: stagePayload.isDefaultActive ?? template.isDefaultActive,
        },
      });

      // 기존 태스크 조회
      const existingTasks = await tx.taskTemplate.findMany({
        where: { stageTemplateId: template.id, deletedAt: null },
      });

      const incomingTasks = stagePayload.tasks || [];
      const incomingTaskIds = new Set(
        incomingTasks.filter((task) => Boolean(task.id)).map((task) => task.id as string),
      );

      // DTO에 더 이상 존재하지 않는 태스크 soft delete
      const tasksToDelete = existingTasks.filter((task) => !incomingTaskIds.has(task.id));
      if (tasksToDelete.length > 0) {
        const now = new Date();
        await tx.taskTemplate.updateMany({
          where: { id: { in: tasksToDelete.map((task) => task.id) } },
          data: { deletedAt: now },
        });
      }

      // 새 태스크 생성 / 기존 태스크 업데이트
      for (const [index, task] of incomingTasks.entries()) {
        const order = typeof task.order === 'number' ? task.order : index;

        if (task.id) {
          await tx.taskTemplate.update({
            where: { id: task.id },
            data: {
              title: task.name,
              description: task.description ?? null,
              isMandatory: task.isMandatory,
              isDefaultActive: task.isDefaultActive ?? true,
              defaultDueDays: typeof task.defaultDueDays === 'number' ? task.defaultDueDays : null,
              order,
              deletedAt: null,
            },
          });
        } else {
          await tx.taskTemplate.create({
            data: {
              title: task.name,
              description: task.description ?? null,
              isMandatory: task.isMandatory,
              isDefaultActive: task.isDefaultActive ?? true,
              defaultDueDays: typeof task.defaultDueDays === 'number' ? task.defaultDueDays : null,
              order,
              stageTemplateId: template.id,
            },
          });
        }
      }
    });

    const refreshed = await this.prisma.stageTemplate.findFirst({
      where: { id: template.id },
      include: {
        taskTemplates: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!refreshed) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return this.toTemplateDetail(refreshed);
  }
}
