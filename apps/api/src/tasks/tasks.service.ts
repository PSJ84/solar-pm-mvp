// apps/api/src/tasks/tasks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, TaskStatus } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // NOTE: 회사/사용자 컨텍스트가 없을 때도 동작하도록 기본값을 보장
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

  private async resolveUserId(optionalUserId?: string): Promise<string> {
    if (optionalUserId) return optionalUserId;

    const companyId = await this.resolveCompanyId();

    let user = await this.prisma.user.findFirst({ where: { companyId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'dev-user@example.com',
          name: 'Local Dev User',
          companyId,
        },
      });
    }

    return user.id;
  }

  private deriveStatusFromDates(
    startDate?: Date | null,
    completedDate?: Date | null,
  ): TaskStatus {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (completedDate && completedDate <= endOfToday) return TaskStatus.COMPLETED;
    if (startDate && startDate <= endOfToday) return TaskStatus.IN_PROGRESS;
    return TaskStatus.PENDING;
  }

  /**
   * 태스크 생성
   */
  async create(dto: CreateTaskDto, userId?: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assigneeId: dto.assigneeId,
        isMandatory: dto.isMandatory || false,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        completedDate: dto.completedDate ? new Date(dto.completedDate) : null,
        status: this.deriveStatusFromDates(
          dto.startDate ? new Date(dto.startDate) : null,
          dto.completedDate ? new Date(dto.completedDate) : null,
        ),
        projectStageId: dto.projectStageId,
      },
    });

    // 활동 로그 기록 (MVP #30)
    await this.createHistory(task.id, resolvedUserId, 'created', null, 'created');

    await this.updateStageStatus(dto.projectStageId);
    await this.touchProjectByStage(dto.projectStageId);

    return task;
  }

  /**
   * 태스크 상세 조회
   */
  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        photos: {
          orderBy: { takenAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        histories: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        projectStage: {
          include: {
            project: {
              select: { id: true, name: true },
            },
            template: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('태스크를 찾을 수 없습니다.');
    }

    return task;
  }

  /**
   * 태스크 수정
   */
  async update(id: string, dto: UpdateTaskDto, userId?: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const existing = await this.findOne(id);
    const changes: string[] = [];

    // 변경 사항 추적
    if (dto.title && dto.title !== existing.title) {
      changes.push(`제목: ${existing.title} → ${dto.title}`);
    }
    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      changes.push(`담당자 변경`);
    }
    if (dto.isMandatory !== undefined && dto.isMandatory !== existing.isMandatory) {
      changes.push(`필수 여부 변경`);
    }
    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      changes.push(`활성 여부 변경`);
    }

    const nextStartDate =
      dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : existing.startDate;
    const nextCompletedDate =
      dto.completedDate !== undefined
        ? dto.completedDate
          ? new Date(dto.completedDate)
          : null
        : existing.completedDate;

    const shouldDeriveStatus = dto.startDate !== undefined || dto.completedDate !== undefined;
    const derivedStatus = shouldDeriveStatus
      ? this.deriveStatusFromDates(nextStartDate, nextCompletedDate)
      : undefined;

    if (derivedStatus && derivedStatus !== existing.status) {
      changes.push(`상태: ${this.getStatusLabel(existing.status)} → ${this.getStatusLabel(derivedStatus)}`);
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
        isMandatory: dto.isMandatory !== undefined ? dto.isMandatory : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
        completedDate:
          dto.completedDate !== undefined ? (dto.completedDate ? new Date(dto.completedDate) : null) : undefined,
        status: derivedStatus,
      },
    });

    // 변경 내역이 있으면 히스토리 기록
    if (changes.length > 0) {
      await this.createHistory(id, resolvedUserId, 'updated', null, null, changes.join(', '));
    }

    await this.updateStageStatus(existing.projectStageId);
    await this.touchProjectByStage(existing.projectStageId);

    return task;
  }

  /**
   * 태스크 상태 변경 + 히스토리 자동 기록 (MVP #30)
   * 설계서 핵심 기능
   */
  async updateStatus(id: string, dto: UpdateTaskStatusDto, userId?: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const existing = await this.findOne(id);
    const oldStatus = existing.status;

    // MVP #20: 착공 강제 조건 체크
    if (dto.status === TaskStatus.COMPLETED && existing.isMandatory) {
      // 필수 태스크 완료 시 추가 검증 로직 가능
      // TODO: 필수 문서 첨부 여부 등 체크
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
    });

    // MVP #30: 활동 로그 자동 기록
    await this.createHistory(
      id,
      resolvedUserId,
      'status_changed',
      oldStatus,
      dto.status,
      dto.comment || `상태 변경: ${this.getStatusLabel(oldStatus)} → ${this.getStatusLabel(dto.status)}`,
    );

    await this.updateStageStatus(existing.projectStageId);
    await this.touchProjectByStage(existing.projectStageId);

    return task;
  }

  /**
   * 태스크 삭제
   */
  async remove(id: string, userId?: string) {
    const resolvedUserId = await this.resolveUserId(userId);
    const existing = await this.findOne(id);

    const deleted = await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.createHistory(id, resolvedUserId, 'deleted', existing.status, existing.status, '태스크 삭제');

    // 둘 다 필요: 단계 상태 갱신 + 프로젝트 최근 수정일 갱신
    await this.updateStageStatus(existing.projectStageId);
    await this.touchProjectByStage(existing.projectStageId);

    return deleted;
  }

  /**
   * 히스토리 기록 (내부 메서드)
   */
  private async createHistory(
    taskId: string,
    userId: string,
    action: string,
    oldValue: string | null,
    newValue: string | null,
    comment?: string,
  ) {
    return this.prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        action,
        oldValue,
        newValue,
        comment,
      },
    });
  }

  /**
   * 상태 라벨 변환 (한글)
   */
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '대기',
      in_progress: '진행중',
      completed: '완료',
      delayed: '지연',
    };
    return labels[status] || status;
  }

  /**
   * 태스크 상태에 따라 단계 상태도 갱신
   */
  private async updateStageStatus(projectStageId: string) {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: projectStageId },
      include: {
        tasks: {
          where: { deletedAt: null, isActive: true },
        },
      },
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

  /** 태스크 활성/비활성 토글 */
  async updateActive(id: string, isActive: boolean) {
    const task = await this.findOne(id);

    const updated = await this.prisma.task.update({
      where: { id },
      data: { isActive },
    });

    await this.updateStageStatus(task.projectStageId);
    await this.touchProjectByStage(task.projectStageId);

    return updated;
  }

  /** 태스크 변경 시 상위 프로젝트 업데이트 시간 갱신 */
  private async touchProjectByStage(projectStageId: string) {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: projectStageId },
    });

    if (!stage) return;

    await this.prisma.project.update({
      where: { id: stage.projectId },
      data: { updatedAt: new Date() },
    });
  }
}
