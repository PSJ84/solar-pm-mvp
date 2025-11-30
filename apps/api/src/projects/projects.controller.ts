// apps/api/src/projects/projects.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, CloneProjectResponseDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: '프로젝트 생성 (MVP #1)' })
  // NOTE: req.user가 없을 수 있으므로 안전하게 companyId를 추출
  async create(@Body() dto: CreateProjectDto, @Req() req: Request) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.projectsService.create(dto, companyId);
  }

  @Get()
  @ApiOperation({ summary: '프로젝트 목록 조회' })
  // NOTE: 인증이 비활성화된 로컬 환경에서도 동작하도록 companyId 추출을 방어적으로 처리
  async findAll(@Req() req: Request) {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.projectsService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: '프로젝트 상세 조회 (단계, 태스크 포함)' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '프로젝트 수정' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.projectsService.update(id, dto, req.user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '프로젝트 삭제 (Soft delete)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user.companyId);
  }

  /**
   * [v1.1] 프로젝트 복제 API
   */
  @Post(':id/clone')
  @ApiOperation({ 
    summary: '프로젝트 복제 (v1.1)',
    description: '기존 프로젝트의 단계/태스크 구조를 복제하여 새 프로젝트 생성. Document/Photo/History는 복제되지 않음.'
  })
  @ApiResponse({ status: 201, type: CloneProjectResponseDto })
  // NOTE: user가 없는 경우에도 복제가 가능하도록 companyId를 안전하게 처리
  async clone(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CloneProjectResponseDto> {
    const user: any = (req as any).user;
    const companyId = user?.companyId;

    return this.projectsService.clone(id, companyId);
  }

  @Get(':id/activity-log')
  @ApiOperation({ summary: '프로젝트 활동 로그 조회 (MVP #30)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getActivityLog(
    @Param('id') id: string,
    @Query('limit') limit: number,
    @Req() req: any,
  ) {
    return this.projectsService.getActivityLog(id, req.user.companyId, limit || 20);
  }
}
