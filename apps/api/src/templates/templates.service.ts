// apps/api/src/templates/templates.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  TemplateDetailDto,
  TemplateListItemDto,
  StageTemplateStageDto,
} from '@shared/types/template.types';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const stage: StageTemplateStageDto = {
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      isRequired: true,
      isDefaultActive: template.isDefaultActive ?? true,
      order: template.order,
      tasks: template.taskTemplates.map((task) => ({
        id: task.id,
        name: task.title,
        description: task.description ?? undefined,
        isMandatory: task.isMandatory,
        isDefaultActive: task.isDefaultActive ?? true,
        defaultDueDays: task.defaultDueDays ?? undefined,
        order: task.order,
      })),
    };

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
}
