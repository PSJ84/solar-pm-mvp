// apps/api/src/templates/templates.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
// Codex가 쓰던 공유 타입 모듈(@shared/types/...)은 우리 프로젝트에 없어서
// 일단 1차 MVP에서는 any 타입으로 막아두고 나중에 shared 타입 만들 때 교체한다.
// import type { ProjectStageTemplateDto } from '@shared/types/template.types';
type ProjectStageTemplateDto = any;

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: '체크리스트 템플릿 목록 조회' })
  async findAll(@Req() req: Request) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.templatesService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: '체크리스트 템플릿 상세 조회' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.templatesService.findOne(id, companyId);
  }

  @Patch('task-templates/:id/checklist-template')
  @UseGuards(JwtAuthGuard)
  async linkChecklistTemplate(
    @Param('id') id: string,
    @Body() body: { checklistTemplateId: string | null },
  ) {
    return this.templatesService.linkChecklistTemplate(id, body.checklistTemplateId);
  }

  @Patch(':id/structure')
  @ApiOperation({ summary: '체크리스트 템플릿 구조 업데이트' })
  async updateStructure(
    @Param('id') id: string,
    @Body() payload: ProjectStageTemplateDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.templatesService.updateStructure(id, payload, companyId);
  }
  @Post()
  @ApiOperation({ summary: '체크리스트 템플릿 생성' })
  async create(@Body() payload: { name: string; description?: string }, @Req() req: Request) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.templatesService.create(payload, companyId);
  }

  @Patch('reorder')
  @ApiOperation({ summary: '체크리스트 템플릿 순서 재정렬' })
  async reorder(
    @Body() body: { templateIds: string[] },
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.templatesService.reorder(body.templateIds || [], companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '체크리스트 템플릿 삭제 (soft delete)' })
  async softDelete(@Param('id') id: string, @Req() req: Request) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.templatesService.softDelete(id, companyId);
  }
}