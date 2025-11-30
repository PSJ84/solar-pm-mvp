// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
  async getFullSummary(@Req() req: any): Promise<DashboardSummaryDto> {
    return this.dashboardService.getFullSummary(req.user.sub, req.user.companyId);
  }

  @Get('summary')
  @ApiOperation({ summary: '대시보드 요약 통계 (기존 API)' })
  async getSummary(@Req() req: any) {
    return this.dashboardService.getSummary(req.user.sub, req.user.companyId);
  }

  @Get('today')
  @ApiOperation({ summary: '오늘 마감 태스크 조회 (MVP #6)' })
  async getTodayTasks(@Req() req: any) {
    return this.dashboardService.getTodayTasks(req.user.sub, req.user.companyId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: '다가오는 마감 태스크 조회' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: '조회 기간 (기본 7일)' })
  async getUpcomingTasks(@Req() req: any, @Query('days') days?: number) {
    return this.dashboardService.getUpcomingTasks(
      req.user.sub,
      req.user.companyId,
      days || 7,
    );
  }

  @Get('risk-projects')
  @ApiOperation({ summary: '지연 위험 프로젝트 조회 (MVP #25)' })
  async getRiskProjects(@Req() req: any) {
    return this.dashboardService.getRiskProjects(req.user.companyId);
  }
}
