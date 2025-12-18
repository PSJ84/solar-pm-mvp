// apps/api/src/dashboard/dto/dashboard-summary.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TaskSummaryItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({ required: false })
  dueDate: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isMandatory: boolean;

  @ApiProperty({ required: false })
  stageName?: string;
}

export class ExpiringDocumentItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty({ required: false })
  docType: string | null;

  @ApiProperty({ required: false })
  expiryDate: string | null;

  @ApiProperty()
  daysUntilExpiry: number;
}

export class RiskProjectItem {
  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty()
  riskScore: number;

  @ApiProperty()
  delayDays: number;

  @ApiProperty()
  severity: string;

  @ApiProperty({ type: [String] })
  factors: string[];

  @ApiProperty()
  overdueTaskCount: number;

  @ApiProperty()
  completionRate: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ type: [TaskSummaryItem] })
  todayTasks: TaskSummaryItem[];

  @ApiProperty({ type: [TaskSummaryItem] })
  upcoming7Days: TaskSummaryItem[];

  @ApiProperty({ type: [ExpiringDocumentItem] })
  expiringDocuments: ExpiringDocumentItem[];

  @ApiProperty({ type: [RiskProjectItem] })
  riskProjects: RiskProjectItem[];

  @ApiProperty()
  stats: {
    totalProjects: number;
    inProgressProjects: number;
    totalMyTasks: number;
    completedMyTasks: number;
    todayDueCount: number;
    riskProjectCount: number;
  };

  // ✅ [API Consolidation] 대시보드 진입시 필요한 전역 데이터 통합
  @ApiProperty({ required: false })
  projects?: any[]; // 프로젝트 목록

  @ApiProperty({ required: false })
  myWorkToday?: any[]; // My Work 오늘 탭 초기 데이터

  @ApiProperty({ required: false })
  vendors?: any[]; // 협력사 목록 (전역)

  @ApiProperty({ required: false })
  templates?: any[]; // 템플릿 목록 (전역)

  @ApiProperty({ required: false })
  budgetCategories?: any[]; // 예산 카테고리 (전역)
}
