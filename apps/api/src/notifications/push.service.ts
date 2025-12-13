import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

type ServiceAccount = admin.ServiceAccount & { privateKey: string };

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;
  private disabledReason?: string;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (!this.isPushEnabled()) {
      this.enabled = false;
      this.disabledReason = 'Push notifications disabled by configuration';
      this.logger.warn(this.disabledReason);
      return;
    }

    const serviceAccount = this.loadServiceAccount();

    if (!serviceAccount) {
      this.enabled = false;
      const reason = this.disabledReason || 'Invalid service account configuration';
      this.logger.warn(`Push notifications disabled: ${reason}`);
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      this.enabled = true;
      this.logger.log('Push notifications enabled');
    } catch (error: any) {
      this.enabled = false;
      this.disabledReason = `Failed to initialize Firebase Admin: ${error.message}`;
      this.logger.error(this.disabledReason);
    }
  }

  private isPushEnabled() {
    return String(process.env.PUSH_ENABLED).toLowerCase() === 'true';
  }

  private loadServiceAccount(): ServiceAccount | null {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (json) {
      try {
        const parsed = JSON.parse(json);
        const { project_id, client_email, private_key } = parsed;

        if (!project_id || !client_email || !private_key) {
          this.disabledReason = 'Missing required keys in FIREBASE_SERVICE_ACCOUNT_JSON';
          return null;
        }

        return {
          projectId: project_id,
          clientEmail: client_email,
          privateKey: String(private_key).replace(/\\n/g, '\n'),
        } as ServiceAccount;
      } catch (error: any) {
        this.disabledReason = `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${error.message}`;
        return null;
      }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.disabledReason = 'Firebase service account environment variables are incomplete';
      return null;
    }

    return {
      projectId,
      clientEmail,
      privateKey,
    } as ServiceAccount;
  }

  async sendDueNotifications() {
    if (!this.enabled) {
      return {
        skipped: true,
        reason: this.disabledReason || 'Push notifications disabled',
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const tasks = await this.prisma.task.findMany({
      where: {
        notificationEnabled: true,
        status: { not: 'completed' },
        dueDate: { not: null },
        deletedAt: null,
      },
      include: {
        projectStage: {
          include: {
            project: {
              include: { company: { include: { users: true } } },
            },
          },
        },
      },
    });

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const dueDate = new Date(task.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (![7, 1, 0].includes(diffDays) && diffDays >= 0) continue;

      if (diffDays === 0 && task.lastNotifiedAt) {
        const minsSinceLastNotify =
          (now.getTime() - new Date(task.lastNotifiedAt).getTime()) / (1000 * 60);
        if (minsSinceLastNotify < (task.reminderIntervalMin || 60)) continue;
      }

      const users = task.projectStage?.project?.company?.users || [];
      for (const user of users) {
        if (!user.fcmToken) continue;

        const dDayText = diffDays === 0 ? 'D-day' : `D-${diffDays}`;
        const projectName = task.projectStage?.project?.name || '';

        try {
          await admin.messaging().send({
            token: user.fcmToken,
            notification: {
              title: `🔔 Solar PM: ${dDayText}`,
              body: `[${projectName}] ${task.title}`,
            },
            data: {
              taskId: task.id,
              projectId: task.projectStage?.project?.id || '',
              dDay: String(diffDays),
            },
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: 'task_reminder',
              },
            },
          });

          this.logger.log(`Sent notification for task ${task.id} to user ${user.id}`);
        } catch (error: any) {
          this.logger.error(`Failed to send notification: ${error.message}`);
        }
      }

      await this.prisma.task.update({
        where: { id: task.id },
        data: { lastNotifiedAt: now },
      });
    }

    return { success: true, timestamp: now };
  }

  async registerToken(userId: string, fcmToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
  }
}
