// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { DocumentsModule } from './documents/documents.module';
import { ShareLinksModule } from './share-links/share-links.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StagesModule } from './stages/stages.module';
import { TemplatesModule } from './templates/templates.module';
import { ChecklistModule } from './checklist/checklist.module';

@Module({
  imports: [
    // 환경변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    // 핵심 모듈
    PrismaModule,
    AuthModule,
    // 기능 모듈
    ProjectsModule,
    TasksModule,
    DocumentsModule,
    ShareLinksModule,
    NotificationsModule,
    DashboardModule,
    StagesModule,
    TemplatesModule,
    ChecklistModule,
  ],
})
export class AppModule {}
