// apps/api/src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '내 알림 목록' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async findMyNotifications(
    @Req() req: any,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findByUser(req.user.sub, unreadOnly);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 알림 개수' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }
}
