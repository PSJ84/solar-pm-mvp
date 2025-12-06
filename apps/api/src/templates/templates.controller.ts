import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { ProjectStageTemplateDto } from '@shared/types/template.types';

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
}
