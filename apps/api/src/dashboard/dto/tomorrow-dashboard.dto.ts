// apps/api/src/dashboard/dto/tomorrow-dashboard.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TaskSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false, nullable: true })
  dueDate: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description: '프로젝트 정보 (선택)',
  })
  project?: { id: string; name: string } | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Object,
    description: '단계 정보 (선택)',
  })
  stage?: { id: string; name?: string | null } | null;
}

export class TomorrowDashboardDto {
  @ApiProperty({ description: 'KST 기준 내일 날짜 (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ type: [TaskSummaryDto] })
  big3: TaskSummaryDto[];

  @ApiProperty({ type: [TaskSummaryDto] })
  dueTomorrow: TaskSummaryDto[];

  @ApiProperty({ type: [TaskSummaryDto] })
  overdue: TaskSummaryDto[];

  @ApiProperty({ type: [TaskSummaryDto] })
  dueToday: TaskSummaryDto[];
}
