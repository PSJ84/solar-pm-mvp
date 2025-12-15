import { Injectable, Logger } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  formatKst,
  formatKstIsoString,
  getDDayDifferenceKst,
  fromKstToUtc,
  getKstNow,
  getKstStartOfDay,
  toKstDate,
} from '../common/date-kst';

type TelegramMode = 'daily' | 'hourly';

interface TaskWithProject extends Prisma.TaskGetPayload<{
  select: {
    id: true;
    title: true;
    dueDate: true;
    status: true;
    lastNotifiedAt: true;
    reminderIntervalMin: true;
    projectStage: {
      select: {
        template: { select: { name: true } };
        project: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}> {}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendNotifications(mode: TelegramMode) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const serverNowUtc = new Date();
    const serverNowKst = getKstNow();

    if (!token || !chatId) {
      const message = 'Telegram configuration missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)';
      this.logger.error(message);
      throw new Error(message);
    }

    if (mode === 'hourly' && this.isWithinQuietHours(serverNowKst)) {
      return {
        mode,
        total: 0,
        sent: 0,
        skipped: 0,
        failures: [],
        skippedReason: 'quiet-hours',
        serverNowUtc: serverNowUtc.toISOString(),
        serverNowKst: formatKstIsoString(serverNowUtc),
      };
    }

    const { todayStartKst, todayEndUtc } = this.getTodayBoundaries();

    const tasks = await this.fetchTargetTasks(mode, todayEndUtc);

    let sent = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const task of tasks) {
      const dueDate = task.dueDate as Date;
      const diffDays = getDDayDifferenceKst(dueDate, todayStartKst);

      if (mode === 'daily' && ![7, 1].includes(diffDays)) {
        skipped += 1;
        continue;
      }

      if (mode === 'hourly' && diffDays > 0) {
        skipped += 1;
        continue;
      }

      if (mode === 'daily' && this.wasNotifiedToday(task.lastNotifiedAt, todayStartKst)) {
        skipped += 1;
        continue;
      }

      if (mode === 'hourly' && !this.shouldSendHourly(task.lastNotifiedAt, task.reminderIntervalMin)) {
        skipped += 1;
        continue;
      }

      try {
        await this.sendTelegramMessage(token, chatId, this.buildMessage(task, diffDays, dueDate));
        await this.prisma.task.update({
          where: { id: task.id },
          data: { lastNotifiedAt: new Date() },
        });
        sent += 1;
      } catch (error: any) {
        failures.push(`${task.id}: ${error?.message || 'unknown error'}`);
        this.logger.error(`Failed to send Telegram notification for task ${task.id}: ${error?.message}`);
      }
    }

    return {
      mode,
      total: tasks.length,
      sent,
      skipped,
      failures,
      serverNowUtc: serverNowUtc.toISOString(),
      serverNowKst: formatKstIsoString(serverNowUtc),
    };
  }

  async sendTestMessage(text = 'Telegram notification test') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      const message = 'Telegram test failed: bot token or chat id missing';
      this.logger.error(message);
      throw new Error(message);
    }

    await this.sendTelegramMessage(token, chatId, text);
    return { success: true };
  }

  private async fetchTargetTasks(mode: TelegramMode, todayEndUtc: Date) {
    const dayRanges = [this.getDayRangeUtc(7), this.getDayRangeUtc(1)];

    const where: Prisma.TaskWhereInput = {
      notificationEnabled: true,
      status: { not: TaskStatus.completed },
      deletedAt: null,
      dueDate: { not: null },
    };

    if (mode === 'daily') {
      where.AND = [
        {
          OR: dayRanges.map((range) => ({ dueDate: { gte: range.startUtc, lt: range.endUtc } })),
        },
      ];
    } else {
      where.dueDate = { lt: todayEndUtc, not: null };
    }

    return this.prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        lastNotifiedAt: true,
        reminderIntervalMin: true,
        projectStage: {
          select: {
            template: { select: { name: true } },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  private getTodayBoundaries() {
    const nowKst = getKstNow();
    const todayStartKst = getKstStartOfDay(nowKst);
    const todayEndKst = new Date(todayStartKst);
    todayEndKst.setDate(todayEndKst.getDate() + 1);

    const todayEndUtc = fromKstToUtc(todayEndKst);

    return { todayStartKst, todayEndUtc };
  }

  private shouldSendHourly(lastNotifiedAt: Date | null, reminderIntervalMin?: number) {
    if (!lastNotifiedAt) return true;
    const interval = reminderIntervalMin || 60;
    const diffMin = (Date.now() - new Date(lastNotifiedAt).getTime()) / (1000 * 60);
    return diffMin >= interval;
  }

  private wasNotifiedToday(lastNotifiedAt: Date | null, todayStartKst: Date) {
    if (!lastNotifiedAt) return false;
    const notifiedKst = toKstDate(new Date(lastNotifiedAt));
    const notifiedStart = getKstStartOfDay(notifiedKst);
    return notifiedStart.getTime() === todayStartKst.getTime();
  }

  private isWithinQuietHours(nowKst: Date) {
    const quietStart = Number(process.env.TELEGRAM_QUIET_START ?? 20);
    const quietEnd = Number(process.env.TELEGRAM_QUIET_END ?? 9);
    const currentHour = nowKst.getHours();

    if (Number.isNaN(quietStart) || Number.isNaN(quietEnd)) return false;
    if (quietStart === quietEnd) return false;

    if (quietStart < quietEnd) {
      return currentHour >= quietStart && currentHour < quietEnd;
    }

    return currentHour >= quietStart || currentHour < quietEnd;
  }

  private buildMessage(task: TaskWithProject, diffDays: number, dueDate: Date) {
    const projectName = this.escapeHtml(task.projectStage?.project?.name || '프로젝트');
    const stageName = this.escapeHtml(task.projectStage?.template?.name || '단계');
    const title = this.escapeHtml(task.title);
    const dDayText =
      diffDays > 0
        ? `D-${diffDays}`
        : diffDays === 0
          ? 'D-day'
          : `D+${Math.abs(diffDays)}`;

    const statusLabel = diffDays < 0 ? '⏰ 마감 지남' : '📌 마감 예정';

    return [
      `[${dDayText}] ${projectName} / ${stageName}`,
      `${title}`,
      `마감: ${formatKst(dueDate)}`,
      `상태: ${statusLabel}`,
    ].join('\n');
  }

  private async sendTelegramMessage(token: string, chatId: string, text: string) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram API error: ${response.status} ${body}`);
    }
  }

  private getDayRangeUtc(daysFromToday: number) {
    const nowKst = getKstNow();
    const target = new Date(nowKst);
    target.setDate(target.getDate() + daysFromToday);
    const startKst = getKstStartOfDay(target);
    const endKst = new Date(startKst);
    endKst.setDate(endKst.getDate() + 1);

    return {
      startUtc: fromKstToUtc(startKst),
      endUtc: fromKstToUtc(endKst),
    };
  }

  private escapeHtml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
