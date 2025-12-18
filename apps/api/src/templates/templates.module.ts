// apps/api/src/templates/templates.module.ts
import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService], // ✅ DashboardService에서 사용하기 위해 export
})
export class TemplatesModule {}
