// apps/api/src/projects/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // NOTE: 인증이 없을 때에도 동작하도록 companyId를 안전하게 해석
  private async resolveCompanyId(optionalCompanyId?: string): Promise<string> {
    if (optionalCompanyId) return optionalCompanyId;

    let company = await this.prisma.company.findFirst();

    if (!company) {
      company = await this.prisma.company.create({
        data: { name: 'Demo Company' },
      });
    }

    return company.id;
  }

  /**
   * 프로젝트 생성 (MVP #1)
   * - 회사의 기본 단계 템플릿을 자동으로 적용
   */
  async create(dto: CreateProjectDto, companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    // 1. 프로젝트 생성
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        address: dto.address,
        capacityKw: dto.capacityKw,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        // [v1.1] 새로 추가된 필드들
        permitNumber: dto.permitNumber,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : null,
        constructionStartAt: dto.constructionStartAt ? new Date(dto.constructionStartAt) : null,
        externalId: dto.externalId,
        tags: dto.tags || [],
        companyId: resolvedCompanyId,
      },
    });

    // 2. 회사의 단계 템플릿 조회
    const stageTemplates = await this.prisma.stageTemplate.findMany({
      where: { companyId: resolvedCompanyId, deletedAt: null },
      include: { taskTemplates: { where: { deletedAt: null } } },
      orderBy: { order: 'asc' },
    });

    // 3. 프로젝트별 단계 인스턴스 생성
    for (const template of stageTemplates) {
      const projectStage = await this.prisma.projectStage.create({
        data: {
          projectId: project.id,
          templateId: template.id,
          status: 'pending',
          isActive: template.isDefaultActive ?? true,
        },
      });

      // 4. 단계별 태스크 인스턴스 생성
      for (const taskTemplate of template.taskTemplates) {
        let dueDate: Date | null = null;
        if (dto.targetDate && taskTemplate.defaultDueDays) {
          dueDate = new Date(dto.targetDate);
          dueDate.setDate(dueDate.getDate() + taskTemplate.defaultDueDays);
        }

        await this.prisma.task.create({
          data: {
            title: taskTemplate.title,
            isMandatory: taskTemplate.isMandatory,
            isActive: taskTemplate.isDefaultActive ?? true,
            dueDate,
            projectStageId: projectStage.id,
            templateId: taskTemplate.id,
          },
        });
      }
    }

    return this.findOne(project.id, resolvedCompanyId);
  }

  /**
   * 회사별 프로젝트 목록 조회
   */
  async findAll(companyId?: string) {
    const where = companyId
      ? { companyId, deletedAt: null }
      : { deletedAt: null };

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        stages: {
          where: { deletedAt: null, isActive: true },
          include: {
            template: true,
            tasks: { where: { deletedAt: null, isActive: true } },
          },
        },
        _count: {
          select: {
            stages: true,
            documents: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 진행률 계산 추가
    return projects.map((project) => {
      const activeStages = project.stages.filter((s) => s.isActive !== false);
      const allTasks = activeStages.flatMap((s) =>
        (s.tasks || []).filter((t) => t.isActive !== false),
      );
      const completedTasks = allTasks.filter((t) => t.status === 'completed');
      const progress = allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;

      return {
        id: project.id,
        name: project.name,
        address: project.address,
        capacityKw: project.capacityKw,
        status: project.status,
        progress,
        // [v1.1] 새로 추가된 필드들
        permitNumber: project.permitNumber,
        tags: project.tags,
        externalId: project.externalId,
        stageCount: project._count.stages,
        documentCount: project._count.documents,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });
  }

  /**
   * 프로젝트 상세 조회
   */
  async findOne(id: string, companyId?: string, includeInactive = false) {
    const where: any = { id, deletedAt: null };
    if (companyId) {
      where.companyId = companyId;
    }

    const project = await this.prisma.project.findFirst({
      where,
      include: {
        stages: {
          where: includeInactive
            ? { deletedAt: null }
            : { deletedAt: null, isActive: true },
          include: {
            template: true,
            tasks: {
              where: includeInactive
                ? { deletedAt: null }
                : { deletedAt: null, isActive: true },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true },
                },
                _count: {
                  select: { photos: true, documents: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: [{ template: { order: 'asc' } }, { createdAt: 'asc' }],
        },
        shareLinks: {
          where: {
            deletedAt: null,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 진행률 계산 (비활성 단계/태스크 제외)
    const activeStages = project.stages.filter((s) => s.isActive !== false);
    const allTasks = activeStages.flatMap((s) =>
      (s.tasks || []).filter((t) => t.isActive !== false),
    );
    const completedTasks = allTasks.filter((t) => t.status === 'completed');
    const progress = allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    return {
      ...project,
      progress,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
    };
  }

  /**
   * 프로젝트 수정
   */
  async update(id: string, dto: UpdateProjectDto, companyId?: string) {
    // 존재 확인
    await this.findOne(id, companyId);

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        capacityKw: dto.capacityKw,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        status: dto.status,
        // [v1.1] 새로 추가된 필드들
        permitNumber: dto.permitNumber,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : undefined,
        constructionStartAt: dto.constructionStartAt ? new Date(dto.constructionStartAt) : undefined,
        externalId: dto.externalId,
        tags: dto.tags,
      },
    });
  }

  async addStageFromTemplate(
    projectId: string,
    templateId: string,
    position?: { afterStageId?: string },
    companyId?: string,
  ) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId: resolvedCompanyId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    const stageTemplate = await this.prisma.stageTemplate.findFirst({
      where: { id: templateId, companyId: resolvedCompanyId, deletedAt: null },
      include: { taskTemplates: { where: { deletedAt: null }, orderBy: { order: 'asc' } } },
    });

    if (!stageTemplate) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    let createdStageId: string | null = null;

    await this.prisma.$transaction(async (tx) => {
      const projectStage = await tx.projectStage.create({
        data: {
          projectId: project.id,
          templateId: stageTemplate.id,
          status: 'pending',
          isActive: stageTemplate.isDefaultActive ?? true,
        },
      });

      createdStageId = projectStage.id;

      for (const taskTemplate of stageTemplate.taskTemplates) {
        let dueDate: Date | null = null;

        if (project.targetDate && taskTemplate.defaultDueDays) {
          dueDate = new Date(project.targetDate);
          dueDate.setDate(dueDate.getDate() + taskTemplate.defaultDueDays);
        }

        await tx.task.create({
          data: {
            title: taskTemplate.title,
            description: taskTemplate.description,
            isMandatory: taskTemplate.isMandatory,
            isActive: taskTemplate.isDefaultActive ?? true,
            status: 'pending',
            dueDate,
            projectStageId: projectStage.id,
            templateId: taskTemplate.id,
          },
        });
      }
    });

    const refreshed = await this.findOne(projectId, resolvedCompanyId, true);

    if (position?.afterStageId && refreshed.stages && createdStageId) {
      const stageOrder = [...refreshed.stages];
      const nextStage = stageOrder.find((stage) => stage.id === createdStageId);
      const targetIndex = stageOrder.findIndex((stage) => stage.id === position.afterStageId);

      if (nextStage && targetIndex >= 0) {
        const filtered = stageOrder.filter((stage) => stage.id !== nextStage.id);
        filtered.splice(targetIndex + 1, 0, nextStage);
        return {
          ...refreshed,
          stages: filtered,
        };
      }
    }

    return refreshed;
  }

  /**
   * 프로젝트 삭제 (Soft delete)
   */
  async remove(id: string, companyId?: string) {
    await this.findOne(id, companyId);
    // [v1.1] Soft delete로 변경
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * [v1.1] 프로젝트 복제 (단순 헤더 복제)
   * - 인증이 없더라도 사용 가능하도록 companyId를 resolve
   */
  async clone(
    sourceProjectId: string,
    companyId?: string,
  ): Promise<{ id: string; name: string }> {
    const source = await this.prisma.project.findFirst({
      where: { id: sourceProjectId, deletedAt: null },
      include: {
        stages: {
          where: { deletedAt: null, isActive: true },
          include: {
            template: true,
            tasks: { where: { deletedAt: null, isActive: true } },
          },
          orderBy: { template: { order: 'asc' } },
        },
      },
    });

    if (!source) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const cloned = await this.prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name: `${source.name} (복제)`,
          address: source.address,
          capacityKw: source.capacityKw,
          status: 'active',
          targetDate: source.targetDate,
          permitNumber: source.permitNumber,
          inspectionDate: source.inspectionDate,
          constructionStartAt: source.constructionStartAt,
          externalId: source.externalId,
          tags: source.tags || [],
          companyId: resolvedCompanyId,
        },
      });

      for (const stage of source.stages) {
        const clonedStage = await tx.projectStage.create({
          data: {
            projectId: newProject.id,
            templateId: stage.templateId,
            status: 'pending',
            startedAt: null,
            completedAt: null,
            startDate: null,
            receivedDate: null,
            completedDate: null,
            isActive: stage.isActive ?? true,
          },
        });

        for (const task of stage.tasks) {
          await tx.task.create({
            data: {
              title: task.title,
              description: task.description,
              isMandatory: task.isMandatory,
              dueDate: null,
              status: 'pending',
              assigneeId: null,
              projectStageId: clonedStage.id,
              templateId: task.templateId,
              tags: task.tags || [],
              isActive: task.isActive ?? true,
            },
          });
        }
      }

      return newProject;
    });

    return cloned;
  }

  /**
   * 프로젝트 최근 활동 로그 조회 (MVP #30)
   */
  async getActivityLog(projectId: string, companyId?: string, limit = 20) {
    await this.findOne(projectId, companyId);

    const histories = await this.prisma.taskHistory.findMany({
      where: {
        task: {
          deletedAt: null,
          projectStage: {
            deletedAt: null,
            projectId,
          },
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return histories;
  }
}
