// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type QueryResultRow = { column_name?: string };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static notificationColumnExists: boolean | null = null;

  async onModuleInit() {
    await this.$connect();
    await this.ensureNotificationColumnFlag();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureNotificationColumnFlag(): Promise<boolean> {
    if (PrismaService.notificationColumnExists !== null) {
      return PrismaService.notificationColumnExists;
    }

    try {
      const rows = (await this.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='tasks' AND column_name='notificationEnabled';`) as QueryResultRow[];
      PrismaService.notificationColumnExists = Array.isArray(rows) && rows.length > 0;
      console.log(
        `Prisma column check tasks.notificationEnabled exists? ${PrismaService.notificationColumnExists}`,
      );
    } catch (error) {
      PrismaService.notificationColumnExists = false;
      console.warn('Prisma column check failed, assuming column missing', error);
    }

    return PrismaService.notificationColumnExists;
  }

  async hasTaskNotificationEnabledColumn(): Promise<boolean> {
    return this.ensureNotificationColumnFlag();
  }
}
