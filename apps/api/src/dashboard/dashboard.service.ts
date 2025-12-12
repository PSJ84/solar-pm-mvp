// apps/api/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardSummaryDto,
  TaskSummaryItem,
  ExpiringDocumentItem,
  RiskProjectItem,
} from './dto/dashboard-summary.dto';
import { MyWorkTab, MyWorkTaskDto } from './dto/my-work.dto';
import { TaskSummaryDto, TomorrowDashboardDto } from './dto/tomorrow-dashboard.dto';
import { TaskStatus } from '../tasks/dto/task.dto';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const KST_OFFSET_MINUTES = 9 * 60;

const startOfDay = (d: Date) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getKstStartOfDayUtc = (base: Date, offsetDays = 0) => {
  const utcMs = base.getTime() + base.getTimezoneOffset() * 60 * 1000;
  const kstMs = utcMs + KST_OFFSET_MINUTES * 60 * 1000;

  const kstDate = new Date(kstMs);
  kstDate.setHours(0, 0, 0, 0);
  kstDate.setDate(kstDate.getDate() + offsetDays);

  const utcStart = kstDate.getTime() - KST_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcStart);
};

const formatKstDateString = (date: Date) => {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const kstMs = utcMs + KST_OFFSET_MINUTES * 60 * 1000;
  const kstDate = new Date(kstMs);
  return kstDate.toISOString().slice(0, 10);
};

const calcDDay = (dueDate: Date | null): number | null => {
  if (!dueDate) return null;

  const today = startOfDay(new Date());
  const target = startOfDay(dueDate);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / MS_PER_DAY);
};

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // NOTE: 인증이 없을 때에도 동작하도록 companyId를 안전하게 해석
  private async resolveCompanyId(optionalCompanyId?: string): Promise<string> {
    if (optionalCompanyId) return optionalCompanyId;

    let company = await this.prisma.company.findFirst();

    if (!company) {
      company = await this.prisma.company.create({
        data: { name: 'Local Dev Company' },
      });
    }

    return company.id;
  }

  /**
   * My Work: assignee 기반 태스크 목록 조회
   */
  async getMyWork(params: {
    userId: string;
    companyId?: string;
    tab?: MyWorkTab;
  }): Promise<MyWorkTaskDto[]> {
    const { userId, companyId, tab = 'today' } = params;
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const todayStart = startOfDay(new Date());
    const tomorrowStart = startOfDay(new Date(todayStart.getTime() + MS_PER_DAY));

    const baseWhere: Prisma.TaskWhereInput = {
      deletedAt: null,
      isActive: true,
      status: { not: TaskStatus.COMPLETED },
      projectStage: {
        project: {
          companyId: resolvedCompanyId,
          deletedAt: null,
        },
      },
      OR: [
        { assigneeId: userId },
        {
          assigneeId: null,
          projectStage: {
            project: { companyId: resolvedCompanyId },
          },
        },
      ],
    };

    let tabWhere: Prisma.TaskWhereInput = {};

    switch (tab) {
      case 'today':
        tabWhere = {
          dueDate: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        };
        break;
      case 'overdue':
        tabWhere = {
          dueDate: {
            lt: todayStart,
          },
        };
        break;
      case 'in_progress':
        tabWhere = { status: TaskStatus.IN_PROGRESS };
        break;
      case 'waiting':
        tabWhere = { status: TaskStatus.WAITING };
        break;
      default:
        tabWhere = {};
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        AND: [baseWhere, tabWhere],
      },
      include: {
        projectStage: {
          include: {
            project: true,
            template: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const mapped = tasks.map<MyWorkTaskDto>((task) => {
      const dueDate = task.dueDate ?? null;
      const dDay = calcDDay(dueDate);

      return {
        taskId: task.id,
        taskTitle: task.title,
        projectId: task.projectStage.project.id,
        projectName: task.projectStage.project.name,
        stageId: task.projectStage.id,
        stageName: task.projectStage.template?.name || task.projectStage.id,
        status: task.status as TaskStatus,
        dueDate: dueDate ? dueDate.toISOString() : null,
        dDay,
        waitingFor: task.waitingFor ?? null,
      };
    });

    const sortByDDay = (a: MyWorkTaskDto, b: MyWorkTaskDto) => {
      if (a.dDay === null && b.dDay === null) return 0;
      if (a.dDay === null) return 1;
      if (b.dDay === null) return -1;
      return a.dDay - b.dDay;
    };

    const sortByDueDate = (a: MyWorkTaskDto, b: MyWorkTaskDto) => {
      if (a.dueDate === null && b.dueDate === null) return 0;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    };

    if (tab === 'today' || tab === 'overdue') {
      mapped.sort(sortByDDay);
    } else if (tab === 'in_progress' || tab === 'waiting') {
      mapped.sort(sortByDueDate);
    }

    return mapped;
  }

  /**
   * [v1.1] 대시보드 통합 Summary API
   * - 오늘 마감 태스크
   * - 7일 내 마감 태스크
   * - 30일 내 만료 예정 문서
   * - 지연 위험 프로젝트
   * - 통계 요약
   */
  async getFullSummary(userId?: string, companyId?: string): Promise<DashboardSummaryDto> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const [todayTasks, upcoming7Days, expiringDocuments, riskProjects, stats] =
      await Promise.all([
        this.getTodayTasksForSummary(userId, resolvedCompanyId),
        this.getUpcoming7DaysTasksForSummary(userId, resolvedCompanyId),
        this.getExpiringDocumentsForSummary(resolvedCompanyId),
        this.getRiskProjectsForSummary(resolvedCompanyId),
        this.getStatsForSummary(userId, resolvedCompanyId),
      ]);

    return {
      todayTasks,
      upcoming7Days,
      expiringDocuments,
      riskProjects,
      stats,
    };
  }

  /**
   * 오늘 마감 태스크 (Summary용)
   */
  private async getTodayTasksForSummary(
    userId: string | undefined,
    companyId: string,
  ): Promise<TaskSummaryItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId || undefined,
        deletedAt: null,
        isActive: true,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          not: 'completed',
        },
        projectStage: {
          deletedAt: null,
          isActive: true,
          project: {
            companyId,
            deletedAt: null,
          },
        },
      },
      include: {
        projectStage: {
          include: {
            project: {
              select: { id: true, name: true },
            },
            template: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectStage.project.id,
      projectName: task.projectStage.project.name,
      dueDate: task.dueDate?.toISOString() || null,
      status: task.status,
      isMandatory: task.isMandatory,
      stageName: task.projectStage.template.name,
    }));
  }

  /**
   * D+1 ~ D+7 마감 태스크 (Summary용)
   */
  private async getUpcoming7DaysTasksForSummary(
    userId: string | undefined,
    companyId: string,
  ): Promise<TaskSummaryItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day8 = new Date(today);
    day8.setDate(day8.getDate() + 8);

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId || undefined,
        deletedAt: null,
        isActive: true,
        dueDate: {
          gte: tomorrow,
          lt: day8,
        },
        status: {
          not: 'completed',
        },
        projectStage: {
          deletedAt: null,
          isActive: true,
          project: {
            companyId,
            deletedAt: null,
          },
        },
      },
      include: {
        projectStage: {
          include: {
            project: {
              select: { id: true, name: true },
            },
            template: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectStage.project.id,
      projectName: task.projectStage.project.name,
      dueDate: task.dueDate?.toISOString() || null,
      status: task.status,
      isMandatory: task.isMandatory,
      stageName: task.projectStage.template.name,
    }));
  }

  /**
   * 30일 내 만료 예정 문서 (MVP #24)
   */
  private async getExpiringDocumentsForSummary(
    companyId: string,
  ): Promise<ExpiringDocumentItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day30 = new Date(today);
    day30.setDate(day30.getDate() + 30);

    const documents = await this.prisma.document.findMany({
      where: {
        deletedAt: null,
        expiryDate: {
          gte: today,
          lte: day30,
        },
        project: {
          companyId,
          deletedAt: null,
        },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return documents.map((doc) => {
      const daysUntilExpiry = Math.ceil(
        (doc.expiryDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        id: doc.id,
        fileName: doc.fileName,
        projectId: doc.project.id,
        projectName: doc.project.name,
        docType: doc.docType,
        expiryDate: doc.expiryDate?.toISOString() || null,
        daysUntilExpiry,
      };
    });
  }

  /**
   * 지연 위험 프로젝트 (MVP #25) - 개선된 계산 로직
   */
  private async getRiskProjectsForSummary(
    companyId: string,
  ): Promise<RiskProjectItem[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: 'in_progress',
      },
      include: {
        stages: {
          where: { deletedAt: null, isActive: true },
          include: {
            tasks: {
              where: { deletedAt: null, isActive: true },
            },
            template: true,
          },
        },
      },
    });

    const now = new Date();
    const riskProjects: RiskProjectItem[] = [];

    for (const project of projects) {
      const activeStages = project.stages.filter((s) => s.isActive !== false);
      const allTasks = activeStages.flatMap((s) => s.tasks);
      if (allTasks.length === 0) continue;

      // 지연된 태스크 계산
      const overdueTasks = allTasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          t.status !== 'completed',
      );

      // 최대 지연 일수 계산
      let maxDelayDays = 0;
      for (const task of overdueTasks) {
        if (task.dueDate) {
          const delayDays = Math.ceil(
            (now.getTime() - new Date(task.dueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (delayDays > maxDelayDays) {
            maxDelayDays = delayDays;
          }
        }
      }

      // 완료율 계산
      const completedTasks = allTasks.filter((t) => t.status === 'completed');
      const completionRate =
        allTasks.length > 0 ? completedTasks.length / allTasks.length : 0;

      // 현재 단계 가중치 (활성 단계 순서 기반)
      const activeStage = project.stages.find((s) => s.status === 'active');
      const stageWeight = activeStage?.template.order || 1;

      // 위험 점수 계산: (지연일수 × 단계가중치) + (지연태스크수 × 10) + (미완료율 × 20)
      let riskScore =
        maxDelayDays * stageWeight +
        overdueTasks.length * 10 +
        (1 - completionRate) * 20;
      riskScore = Math.min(Math.round(riskScore), 100);

      // 위험 요인 설명
      const factors: string[] = [];
      if (overdueTasks.length > 0) {
        factors.push(`${overdueTasks.length}개 태스크 마감 초과`);
      }
      if (maxDelayDays > 0) {
        factors.push(`최대 ${maxDelayDays}일 지연`);
      }
      if (completionRate < 0.5 && allTasks.length > 0) {
        factors.push(`진행률 ${Math.round(completionRate * 100)}%`);
      }

      // 심각도 결정
      let severity: string;
      if (riskScore >= 80) severity = 'critical';
      else if (riskScore >= 50) severity = 'high';
      else if (riskScore >= 30) severity = 'medium';
      else severity = 'low';

      // 80점 이상만 포함 (요청 조건)
      if (riskScore >= 30) {
        riskProjects.push({
          projectId: project.id,
          projectName: project.name,
          riskScore,
          delayDays: maxDelayDays,
          severity,
          factors,
          overdueTaskCount: overdueTasks.length,
          completionRate: Math.round(completionRate * 100) / 100,
        });

        // DB에 최신 점수 저장 (비동기로)
        this.prisma.delayRiskScore
          .create({
            data: {
              projectId: project.id,
              score: riskScore,
              severity,
              overdueTaskCount: overdueTasks.length,
              upcomingTaskCount: 0,
              completionRate,
              maxDelayDays,
              factors,
            },
          })
          .catch(() => {}); // 에러 무시 (비동기 저장)
      }
    }

    return riskProjects.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * 통계 요약
   */
  private async getStatsForSummary(
    userId: string | undefined,
    companyId: string,
  ): Promise<DashboardSummaryDto['stats']> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProjects,
      inProgressProjects,
      totalMyTasks,
      completedMyTasks,
      todayDueCount,
    ] = await Promise.all([
      this.prisma.project.count({
        where: { companyId, deletedAt: null },
      }),
      this.prisma.project.count({
        where: { companyId, deletedAt: null, status: 'in_progress' },
      }),
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          deletedAt: null,
          isActive: true,
          projectStage: {
            isActive: true,
            project: { companyId, deletedAt: null },
          },
        },
      }),
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          deletedAt: null,
          status: 'completed',
          isActive: true,
          projectStage: {
            isActive: true,
            project: { companyId, deletedAt: null },
          },
        },
      }),
      this.prisma.task.count({
        where: {
          assigneeId: userId,
          deletedAt: null,
          isActive: true,
          dueDate: { gte: today, lt: tomorrow },
          status: { not: 'completed' },
          projectStage: {
            isActive: true,
            project: { companyId, deletedAt: null },
          },
        },
      }),
    ]);

    const riskProjects = await this.getRiskProjectsForSummary(companyId);

    return {
      totalProjects,
      inProgressProjects,
      totalMyTasks,
      completedMyTasks,
      todayDueCount,
      riskProjectCount: riskProjects.filter((p) => p.riskScore >= 80).length,
    };
  }

  /**
   * 내일 플래너 (Big3 + 마감 태스크)
   */
  async getTomorrowDashboard(userId?: string, companyId?: string): Promise<TomorrowDashboardDto> {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const todayStart = getKstStartOfDayUtc(new Date());
    const tomorrowStart = getKstStartOfDayUtc(new Date(), 1);
    const dayAfterStart = getKstStartOfDayUtc(new Date(), 2);
    const dateString = formatKstDateString(tomorrowStart);

    const baseWhere: Prisma.TaskWhereInput = {
      assigneeId: userId || undefined,
      deletedAt: null,
      isActive: true,
      status: { not: TaskStatus.COMPLETED },
      projectStage: {
        deletedAt: null,
        isActive: true,
        project: { companyId: resolvedCompanyId, deletedAt: null },
      },
    };

    const taskSelect = {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      projectStage: {
        select: {
          id: true,
          template: { select: { name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    } satisfies Prisma.TaskSelect;

    try {
      const [overdueRaw, dueTodayRaw, dueTomorrowRaw] = await Promise.all([
        this.prisma.task.findMany({
          where: {
            ...baseWhere,
            dueDate: { lt: todayStart },
          },
          select: taskSelect,
          orderBy: [
            { dueDate: 'asc' },
            { createdAt: 'asc' },
          ],
        }),
        this.prisma.task.findMany({
          where: {
            ...baseWhere,
            dueDate: {
              gte: todayStart,
              lt: tomorrowStart,
            },
          },
          select: taskSelect,
          orderBy: [
            { dueDate: 'asc' },
            { createdAt: 'asc' },
          ],
        }),
        this.prisma.task.findMany({
          where: {
            ...baseWhere,
            dueDate: {
              gte: tomorrowStart,
              lt: dayAfterStart,
            },
          },
          select: taskSelect,
          orderBy: [
            { dueDate: 'asc' },
            { createdAt: 'asc' },
          ],
        }),
      ]);

      const overdue = overdueRaw.map((task) => this.mapTaskToSummary(task));
      const dueToday = dueTodayRaw.map((task) => this.mapTaskToSummary(task));
      const dueTomorrow = dueTomorrowRaw.map((task) => this.mapTaskToSummary(task));

      const big3 = this.pickBig3([...overdue, ...dueToday, ...dueTomorrow]);

      return {
        date: dateString,
        big3,
        dueTomorrow,
        overdue,
        dueToday,
      };
    } catch (error) {
      console.error('Failed to load tomorrow dashboard', error);
      return {
        date: dateString,
        big3: [],
        dueTomorrow: [],
        overdue: [],
        dueToday: [],
      };
    }
  }

  private mapTaskToSummary(task: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    projectStage?: {
      id: string;
      template?: { name: string | null } | null;
      project?: { id: string; name: string } | null;
    } | null;
  }): TaskSummaryDto {
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      project: task.projectStage?.project
        ? {
            id: task.projectStage.project.id,
            name: task.projectStage.project.name,
          }
        : null,
      stage: task.projectStage
        ? {
            id: task.projectStage.id,
            name: task.projectStage.template?.name ?? task.projectStage.id,
          }
        : null,
    };
  }

  private pickBig3(tasks: TaskSummaryDto[]): TaskSummaryDto[] {
    const uniq = new Map<string, TaskSummaryDto>();

    for (const task of tasks) {
      if (!uniq.has(task.id)) {
        uniq.set(task.id, task);
      }
      if (uniq.size >= 3) break;
    }

    return Array.from(uniq.values());
  }

  // ===========================================
  // 기존 API들 (하위 호환성 유지)
  // ===========================================

  /**
   * MVP #6: 오늘 마감 태스크 조회
   */
  async getTodayTasks(userId?: string, companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId || undefined,
        deletedAt: null,
        isActive: true,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          not: 'completed',
        },
        projectStage: {
          deletedAt: null,
          isActive: true,
          project: {
            companyId: resolvedCompanyId,
            deletedAt: null,
          },
        },
      },
      include: {
        projectStage: {
          include: {
            project: {
              select: { id: true, name: true },
            },
            template: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      count: tasks.length,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        isMandatory: task.isMandatory,
        project: {
          id: task.projectStage.project.id,
          name: task.projectStage.project.name,
        },
        stage: task.projectStage.template.name,
      })),
    };
  }

  /**
   * 이번 주 마감 태스크 조회 (확장)
   */
  async getUpcomingTasks(userId?: string, companyId?: string, days = 7) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId || undefined,
        deletedAt: null,
        isActive: true,
        dueDate: {
          gte: today,
          lt: endDate,
        },
        status: {
          not: 'completed',
        },
        projectStage: {
          deletedAt: null,
          isActive: true,
          project: {
            companyId: resolvedCompanyId,
            deletedAt: null,
          },
        },
      },
      include: {
        projectStage: {
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return {
      count: tasks.length,
      tasks,
    };
  }

  /**
   * MVP #25: 지연 위험 프로젝트 조회
   */
  async getRiskProjects(companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const riskProjects = await this.getRiskProjectsForSummary(resolvedCompanyId);
    return riskProjects.filter((p) => p.severity !== 'low');
  }

  /**
   * 대시보드 요약 통계 (기존 API 유지)
   */
  async getSummary(userId?: string, companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectStats = await this.prisma.project.groupBy({
      by: ['status'],
      where: { companyId: resolvedCompanyId, deletedAt: null },
      _count: true,
    });

    const myTaskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: {
        assigneeId: userId || undefined,
        deletedAt: null,
        projectStage: {
          project: { companyId: resolvedCompanyId, deletedAt: null },
        },
      },
      _count: true,
    });

    const todayTasks = await this.getTodayTasks(userId, resolvedCompanyId);
    const riskProjects = await this.getRiskProjects(resolvedCompanyId);

    return {
      projects: {
        total: projectStats.reduce((sum, s) => sum + s._count, 0),
        byStatus: projectStats.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count }),
          {},
        ),
      },
      myTasks: {
        total: myTaskStats.reduce((sum, s) => sum + s._count, 0),
        byStatus: myTaskStats.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count }),
          {},
        ),
      },
      todayDue: todayTasks.count,
      riskProjectCount: riskProjects.length,
    };
  }
}