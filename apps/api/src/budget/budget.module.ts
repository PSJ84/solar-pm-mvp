// apps/api/src/budget/budget.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { BudgetTimingInterceptor } from './interceptors/budget-timing.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetTimingInterceptor],
})
export class BudgetModule {}
