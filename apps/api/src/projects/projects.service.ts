// apps/api/src/projects/projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, CloneProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 프로젝트 생성 (MVP #1)
   * - 회사의 기본 단계 템플릿을 자동으로 적용
   */
  async create(dto: CreateProjectDto, companyId: string) {
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
        companyId,
      },
    });

    // 2. 회사의 단계 템플릿 조회
    const stageTemplates = await this.prisma.stageTemplate.findMany({
      where: { companyId, deletedAt: null },
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
            dueDate,
            projectStageId: projectStage.id,
            templateId: taskTemplate.id,
          },
        });
      }
    }

    return this.findOne(project.id, companyId);
  }

  /**
   * 회사별 프로젝트 목록 조회
   */
  async findAll(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { companyId, deletedAt: null },
      include: {
        stages: {
          where: { deletedAt: null },
          include: {
            tasks: { where: { deletedAt: null } },
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
      const allTasks = project.stages.flatMap((s) => s.tasks);
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
  async findOne(id: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        stages: {
          where: { deletedAt: null },
          include: {
            template: true,
            tasks: {
              where: { deletedAt: null },
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
          orderBy: { template: { order: 'asc' } },
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

    // 진행률 계산
    const allTasks = project.stages.flatMap((s) => s.tasks);
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
  async update(id: string, dto: UpdateProjectDto, companyId: string) {
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

  /**
   * 프로젝트 삭제 (Soft delete)
   */
  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    // [v1.1] Soft delete로 변경
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * [v1.1] 프로젝트 복제
   * - Project, ProjectStage, Task를 복제
   * - Document/Photo/History는 복제하지 않음
   */
  async clone(
    sourceId: string,
    companyId: string,
    dto: CloneProjectDto = {},
  ): Promise<{ id: string; name: string }> {
    // 1. 원본 프로젝트 조회
    const source = await this.prisma.project.findFirst({
      where: { id: sourceId, companyId, deletedAt: null },
      include: {
        stages: {
          where: { deletedAt: null },
          include: {
            template: true,
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundException('원본 프로젝트를 찾을 수 없습니다.');
    }

    const copyAssignees = dto.copyAssignees !== false; // 기본값 true
    const newName = dto.name || `${source.name} (복사본)`;

    // 2. Prisma 트랜잭션으로 복제 실행
    const result = await this.prisma.$transaction(async (tx) => {
      // 2-1. 새 프로젝트 생성
      const newProject = await tx.project.create({
        data: {
          name: newName,
          address: source.address,
          capacityKw: source.capacityKw,
          targetDate: null, // 마감일은 초기화
          status: 'planning',
          companyId: source.companyId,
          // [v1.1] 필드들은 원본에서 복사 (일부 초기화)
          permitNumber: null, // 허가번호는 초기화
          inspectionDate: null,
          constructionStartAt: null,
          externalId: null,
          tags: source.tags,
        },
      });

      // 2-2. 단계 복제
      for (const stage of source.stages) {
        const newStage = await tx.projectStage.create({
          data: {
            projectId: newProject.id,
            templateId: stage.templateId,
            status: 'pending', // 상태 초기화
            startedAt: null,
            completedAt: null,
          },
        });

        // 2-3. 태스크 복제
        for (const task of stage.tasks) {
          await tx.task.create({
            data: {
              title: task.title,
              description: task.description,
              dueDate: null, // 마감일 초기화
              status: 'pending', // 상태 초기화
              isMandatory: task.isMandatory,
              assigneeId: copyAssignees ? task.assigneeId : null,
              projectStageId: newStage.id,
              templateId: task.templateId,
              tags: task.tags,
            },
          });
        }
      }

      return newProject;
    });

    return {
      id: result.id,
      name: result.name,
    };
  }

  /**
   * 프로젝트 최근 활동 로그 조회 (MVP #30)
   */
  async getActivityLog(projectId: string, companyId: string, limit = 20) {
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
