// apps/api/src/templates/templates.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Codex가 사용하던 공유 타입 경로가 실제로는 없어서 TS 에러가 남
// 나중에 packages/shared 쪽으로 타입 분리할 때 다시 정리하면 되고,
// 지금은 런타임 동작이 우선이라 임시로 any 타입으로 정의해서 막는다.
// import type {
//   TemplateDetailDto,
//   TemplateListItemDto,
//   StageTemplateStageDto,
//   StageTemplateTaskDto,
//   ProjectStageTemplateDto,
// } from '@shared/types/template.types';
import type { StageTemplate, TaskTemplate } from '@prisma/client';

// ===== 임시 타입 정의 (MVP용, 나중에 실제 타입으로 교체해도 됨) =====
type TemplateDetailDto = any;
type TemplateListItemDto = any;
type StageTemplateStageDto = any;
type StageTemplateTaskDto = any;
type ProjectStageTemplateDto = any;

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private toStageDto(
    template: StageTemplate & {
      taskTemplates: (TaskTemplate & {
        checklistTemplate?: { id: string; name: string; _count?: { items: number } } | null;
      })[];
    },
  ): StageTemplateStageDto {
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

  private toTaskDto(
    task: TaskTemplate & {
      checklistTemplate?: { id: string; name: string; _count?: { items: number } } | null;
    },
  ): StageTemplateTaskDto {
    return {
      id: task.id,
      name: task.title,
      description: task.description ?? undefined,
      isMandatory: task.isMandatory,
      isDefaultActive: task.isDefaultActive ?? true,
      defaultDueDays: task.defaultDueDays ?? undefined,
      order: task.order,
      checklistTemplateId: task.checklistTemplate?.id ?? null,
      checklistTemplateName: task.checklistTemplate?.name ?? null,
    };
  }

  private toTemplateDetail(
    template: StageTemplate & {
      taskTemplates: (TaskTemplate & {
        checklistTemplate?: { id: string; name: string; _count?: { items: number } } | null;
      })[];
    },
  ): TemplateDetailDto {
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
          include: {
            checklistTemplate: {
              select: { id: true, name: true, _count: { select: { items: true } } },
            },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return this.toTemplateDetail(template);
  }

  async linkChecklistTemplate(taskTemplateId: string, checklistTemplateId: string | null) {
    return this.prisma.taskTemplate.update({
      where: { id: taskTemplateId },
      data: { checklistTemplateId },
      include: {
        checklistTemplate: {
          include: { items: true },
        },
      },
    });
  }

  async create(payload: { name: string; description?: string }, companyId?: string): Promise<TemplateDetailDto> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const lastTemplate = await this.prisma.stageTemplate.findFirst({
      where: { companyId: resolvedCompanyId, deletedAt: null },
      orderBy: { order: 'desc' },
    });

    const template = await this.prisma.stageTemplate.create({
      data: {
        companyId: resolvedCompanyId,
        name: payload.name,
        description: payload.description ?? null,
        order: lastTemplate ? lastTemplate.order + 1 : 0,
        isDefaultActive: true,
      },
    });

    return this.toTemplateDetail({ ...template, taskTemplates: [] });
  }

  /**
   * 템플릿 순서 재정렬
   */
  async reorder(templateIds: string[], companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const tx = templateIds.map((id, index) =>
      this.prisma.stageTemplate.update({
        where: { id },
        data: { order: index },
      }),
    );

    if (tx.length > 0) {
      await this.prisma.$transaction(tx);
    }

    return this.prisma.stageTemplate.findMany({
      where: { companyId: resolvedCompanyId, deletedAt: null },
      include: { taskTemplates: { where: { deletedAt: null } } },
      orderBy: { order: 'asc' },
    });
  }

  async softDelete(id: string, companyId?: string): Promise<void> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const template = await this.prisma.stageTemplate.findFirst({
      where: { id, companyId: resolvedCompanyId, deletedAt: null },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.stageTemplate.update({
        where: { id: template.id },
        data: { deletedAt: now },
      });

      await tx.taskTemplate.updateMany({
        where: { stageTemplateId: template.id, deletedAt: null },
        data: { deletedAt: now },
      });
    });
  }

  async updateStructure(
    id: string,
    payload: ProjectStageTemplateDto,
    companyId?: string,
  ): Promise<TemplateDetailDto> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const template = await this.prisma.stageTemplate.findFirst({
      where: { id, companyId: resolvedCompanyId, deletedAt: null },
      include: {
        taskTemplates: {
          where: { deletedAt: null },
          include: {
            checklistTemplate: {
              select: { id: true, name: true, _count: { select: { items: true } } },
            },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    const stagePayload = payload.stages?.[0];
    if (!stagePayload) {
      throw new BadRequestException('단계 정보가 필요합니다.');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1) 단계 기본 정보 업데이트
      await tx.stageTemplate.update({
        where: { id: template.id },
        data: {
          name: payload.name,
          description: payload.description ?? stagePayload.description ?? null,
          order: stagePayload.order ?? template.order,
          isDefaultActive: stagePayload.isDefaultActive ?? template.isDefaultActive,
        },
      });

      // 2) 기존 태스크 / 들어온 태스크 비교
      const existingTasks = await tx.taskTemplate.findMany({
        where: { stageTemplateId: template.id, deletedAt: null },
      });

      const existingTaskMap = new Map(existingTasks.map((t) => [t.id, t]));

      const incomingTasks = stagePayload.tasks || [];

      // DB에 실제로 존재하는 태스크 id 집합만 사용
      const incomingExistingIds = new Set(
        incomingTasks
          .map((task) => task.id)
          .filter((id): id is string => !!id && existingTaskMap.has(id)),
      );

      // 3) payload에 없는 기존 태스크는 soft delete
      const tasksToDelete = existingTasks.filter((task) => !incomingExistingIds.has(task.id));
      if (tasksToDelete.length > 0) {
        const now = new Date();
        await tx.taskTemplate.updateMany({
          where: { id: { in: tasksToDelete.map((t) => t.id) } },
          data: { deletedAt: now },
        });
      }

      // 4) 나머지 태스크들 upsert (실제 id는 update, 나머지는 create)
      for (const [index, task] of incomingTasks.entries()) {
        const order = typeof task.order === 'number' ? task.order : index;

        const isExisting = !!task.id && existingTaskMap.has(task.id);

        if (isExisting && task.id) {
          // ✅ DB에 있는 태스크 → update
          await tx.taskTemplate.update({
            where: { id: task.id },
            data: {
              title: task.name,
              description: task.description ?? null,
              isMandatory: task.isMandatory,
              isDefaultActive: task.isDefaultActive ?? true,
              defaultDueDays:
                typeof task.defaultDueDays === 'number' ? task.defaultDueDays : null,
              order,
              deletedAt: null,
            },
          });
        } else {
          // ✅ 새 태스크(temp-... 포함) → create
          await tx.taskTemplate.create({
            data: {
              title: task.name,
              description: task.description ?? null,
              isMandatory: task.isMandatory,
              isDefaultActive: task.isDefaultActive ?? true,
              defaultDueDays:
                typeof task.defaultDueDays === 'number' ? task.defaultDueDays : null,
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
          include: {
            checklistTemplate: {
              select: { id: true, name: true, _count: { select: { items: true } } },
            },
          },
        },
      },
    });

    if (!refreshed) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    return this.toTemplateDetail(refreshed);
  }
}