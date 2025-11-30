// apps/api/src/share-links/share-links.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShareLinksService } from './share-links.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateShareLinkDto {
  projectId: string;
  password?: string;
  expiresAt?: string;
  allowedStages?: string[];
}

@ApiTags('Share Links')
@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  // 인증 필요한 엔드포인트
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '공유 링크 생성 (MVP #9)' })
  async create(@Body() dto: CreateShareLinkDto, @Req() req: any) {
    return this.shareLinksService.create({
      projectId: dto.projectId,
      password: dto.password,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      allowedStages: dto.allowedStages,
      createdById: req.user.sub,
    });
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 공유 링크 목록' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.shareLinksService.findByProject(projectId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '공유 링크 삭제' })
  async remove(@Param('id') id: string) {
    return this.shareLinksService.remove(id);
  }

  // 인증 불필요 - 외부 접근용
  @Get('view/:token')
  @ApiOperation({ summary: '공유 링크로 프로젝트 조회 (외부 접근)' })
  @ApiQuery({ name: 'password', required: false })
  async viewByToken(
    @Param('token') token: string,
    @Query('password') password?: string,
  ) {
    return this.shareLinksService.findByToken(token, password);
  }
}
