// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { TomorrowDashboardDto } from './dto/tomorrow-dashboard.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MyWorkTab } from './dto/my-work.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('my-work')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 작업(My Work) 태스크 조회' })
  @ApiQuery({
    name: 'tab',
    required: false,
    description: 'today | in_progress | waiting | overdue',
  })
  async getMyWork(@Req() req: Request, @Query('tab') tab?: string) {
    const user: any = (req as any).user;
    const userId = user?.id;
    const companyId = user?.companyId;

    const normalizedTab: MyWorkTab = ['today', 'in_progress', 'waiting', 'overdue'].includes(
      tab as MyWorkTab,
    )
      ? (tab as MyWorkTab)
      : 'today';

    return this.dashboardService.getMyWork({ userId, companyId, tab: normalizedTab });
  }

  /**
   * [v1.1] 통합 대시보드 Summary API
   * - 오늘 마감 태스크, 7일 내 마감, 만료 임박 문서, 지연 위험 프로젝트를 한 번에 반환
   */
  @Get('full-summary')
  @ApiOperation({
    summary: '대시보드 통합 Summary (v1.1)',
    description: '오늘 마감 태스크, D+1~D+7 태스크, 30일 내 만료 문서, 지연 위험 프로젝트를 한 번에 반환'
  })
  @ApiResponse({ status: 200, type: DashboardSummaryDto })
  async getFullSummary(@Req() req: Request): Promise<DashboardSummaryDto> {
    const user: any = (req as any).user;
    const userId = user?.sub;
    const companyId = user?.companyId;

    return this.dashboardService.getFullSummary(userId, companyId);
  }

  @Get('summary')
  @ApiOperation({ summary: '대시보드 요약 통계 (기존 API)' })
  async getSummary(@Req() req: Request) {
    const user: any = (req as any).user;
    const userId = user?.sub;
    const companyId = user?.companyId;

    return this.dashboardService.getSummary(userId, companyId);
  }

  @Get('tomorrow')
  @ApiOperation({ summary: '내일 플래너 (Big3/마감 태스크)' })
  @ApiResponse({ status: 200, type: TomorrowDashboardDto })
  async getTomorrowDashboard(@Req() req: Request): Promise<TomorrowDashboardDto> {
    const user: any = (req as any).user;
    const userId = user?.sub || user?.id;
    const companyId = user?.companyId;

    return this.dashboardService.getTomorrowDashboard(userId, companyId);
  }

  @Get('today')
  @ApiOperation({ summary: '오늘 마감 태스크 조회 (MVP #6)' })
  async getTodayTasks(@Req() req: Request) {
    const user: any = (req as any).user;
    const userId = user?.sub;
    const companyId = user?.companyId;

    return this.dashboardService.getTodayTasks(userId, companyId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: '다가오는 마감 태스크 조회' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: '조회 기간 (기본 7일)' })
  async getUpcomingTasks(@Req() req: Request, @Query('days') days?: number) {
    const user: any = (req as any).user;
    const userId = user?.sub;
    const companyId = user?.companyId;

    return this.dashboardService.getUpcomingTasks(userId, companyId, days || 7);
  }

  @Get('risk-projects')
  @ApiOperation({ summary: '지연 위험 프로젝트 조회 (MVP #25)' })
  async getRiskProjects(@Req() req: Request) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.dashboardService.getRiskProjects(companyId);
  }
}
