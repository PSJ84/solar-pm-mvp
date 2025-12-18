// apps/api/src/dashboard/dashboard.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
// ✅ [API Consolidation] 통합 데이터 조회를 위한 모듈 import
import { ProjectsModule } from '../projects/projects.module';
import { VendorsModule } from '../vendors/vendors.module';
import { TemplatesModule } from '../templates/templates.module';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [
    forwardRef(() => ProjectsModule),
    VendorsModule,
    TemplatesModule,
    BudgetModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
