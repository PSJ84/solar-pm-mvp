// apps/api/src/notifications/notifications.controller.ts
import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Param,
  Post,
  Query,
  Req,
  BadRequestException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 알림 목록' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async findMyNotifications(
    @Req() req: any,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findByUser(req.user.sub, unreadOnly);
  }

  @Get('unread-count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '읽지 않은 알림 개수' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { count };
  }

  @Patch(':id/read')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '알림 읽음 처리' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Patch('read-all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Post('push/trigger')
  async triggerPushNotifications(@Headers('x-cron-secret') secret: string) {
    if (secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    return this.pushService.sendDueNotifications();
  }

  @Post('push/register-token')
  async registerFcmToken(@Body() body: { userId: string; fcmToken: string }) {
    return this.pushService.registerToken(body.userId, body.fcmToken);
  }

  @Post('telegram/trigger')
  async triggerTelegram(
    @Headers('x-cron-secret') secret: string,
    @Query('mode') mode: 'daily' | 'hourly' = 'daily',
  ) {
    if (secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('Invalid cron secret');
    }

    if (!['daily', 'hourly'].includes(mode)) {
      throw new BadRequestException('mode must be daily or hourly');
    }

    return this.telegramService.sendNotifications(mode);
  }

  @Post('telegram/test')
  async triggerTelegramTest(@Headers('x-cron-secret') secret: string) {
    const requireSecret =
      String(process.env.TELEGRAM_TEST_REQUIRE_SECRET ?? 'true').toLowerCase() !== 'false';

    if (requireSecret && secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('Invalid cron secret');
    }

    return this.telegramService.sendTestMessage();
  }
}
