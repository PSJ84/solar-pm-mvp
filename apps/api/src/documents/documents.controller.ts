// apps/api/src/documents/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: '프로젝트 문서 목록 조회' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.documentsService.findByProject(projectId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '문서 버전 히스토리 조회 (MVP #3)' })
  async getVersionHistory(@Param('id') id: string) {
    return this.documentsService.getVersionHistory(id);
  }

  @Get('expiring')
  @ApiOperation({ summary: '만료 예정 문서 조회 (MVP #24)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getExpiringDocuments(@Req() req: any, @Query('days') days?: number) {
    return this.documentsService.getExpiringDocuments(
      req.user.companyId,
      days || 30,
    );
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'S3 업로드 URL 발급 (TODO: 실제 연동)' })
  async getUploadUrl(
    @Body() dto: { fileName: string; contentType: string },
  ) {
    return this.documentsService.getUploadUrl(dto.fileName, dto.contentType);
  }
}
