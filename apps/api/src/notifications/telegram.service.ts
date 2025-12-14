import { Injectable, Logger } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  private readonly kstOffsetMs = 9 * 60 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async sendNotifications(mode: TelegramMode) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      const message = 'Telegram configuration missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)';
      this.logger.error(message);
      throw new Error(message);
    }

    const { todayStartKst, todayEndUtc } = this.getTodayBoundaries();

    const tasks = await this.fetchTargetTasks(mode, todayEndUtc);

    let sent = 0;
    let skipped = 0;
    const failures: string[] = [];

    for (const task of tasks) {
      const dueDate = task.dueDate as Date;
      const diffDays = this.getDDayDifference(dueDate, todayStartKst);

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

    return { mode, total: tasks.length, sent, skipped, failures };
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

  private getDDayDifference(dueDate: Date, todayStartKst: Date) {
    const dueKstStart = this.getKstStartOfDay(this.toKstDate(dueDate));
    const diffMs = dueKstStart.getTime() - todayStartKst.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  private getTodayBoundaries() {
    const nowKst = this.getKstNow();
    const todayStartKst = this.getKstStartOfDay(nowKst);
    const todayEndKst = new Date(todayStartKst);
    todayEndKst.setDate(todayEndKst.getDate() + 1);

    const todayEndUtc = this.fromKstToUtc(todayEndKst);

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
    const notifiedKst = this.toKstDate(new Date(lastNotifiedAt));
    const notifiedStart = this.getKstStartOfDay(notifiedKst);
    return notifiedStart.getTime() === todayStartKst.getTime();
  }

  private buildMessage(task: TaskWithProject, diffDays: number, dueDate: Date) {
    const projectName = this.escapeHtml(task.projectStage?.project?.name || '프로젝트');
    const title = this.escapeHtml(task.title);
    const dDayText =
      diffDays > 0
        ? `D-${diffDays}`
        : diffDays === 0
          ? 'D-day'
          : `D+${Math.abs(diffDays)}`;

    const statusLabel = diffDays < 0 ? '⏰ 마감 지남' : '📌 마감 예정';

    return [
      `<b>${dDayText}</b> | <b>${projectName}</b>`,
      `• 태스크: ${title}`,
      `• 마감: ${this.formatKst(dueDate)}`,
      `• 상태: ${statusLabel}`,
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

  private getKstNow() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    return new Date(utcMs + this.kstOffsetMs);
  }

  private toKstDate(date: Date) {
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
    return new Date(utcMs + this.kstOffsetMs);
  }

  private fromKstToUtc(date: Date) {
    return new Date(date.getTime() - this.kstOffsetMs);
  }

  private getKstStartOfDay(date: Date) {
    const kstDate = new Date(date);
    kstDate.setHours(0, 0, 0, 0);
    return kstDate;
  }

  private getDayRangeUtc(daysFromToday: number) {
    const nowKst = this.getKstNow();
    const target = new Date(nowKst);
    target.setDate(target.getDate() + daysFromToday);
    const startKst = this.getKstStartOfDay(target);
    const endKst = new Date(startKst);
    endKst.setDate(endKst.getDate() + 1);

    return {
      startUtc: this.fromKstToUtc(startKst),
      endUtc: this.fromKstToUtc(endKst),
    };
  }

  private formatKst(date: Date) {
    const kst = this.toKstDate(date);
    const year = kst.getFullYear();
    const month = String(kst.getMonth() + 1).padStart(2, '0');
    const day = String(kst.getDate()).padStart(2, '0');
    const hours = String(kst.getHours()).padStart(2, '0');
    const minutes = String(kst.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes} (KST)`;
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
