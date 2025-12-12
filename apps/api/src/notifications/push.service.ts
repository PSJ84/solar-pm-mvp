import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async sendDueNotifications() {
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
