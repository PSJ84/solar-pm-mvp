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
}
