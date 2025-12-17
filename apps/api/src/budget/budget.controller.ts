// apps/api/src/budget/budget.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BudgetService } from './budget.service';
import { BudgetTimingInterceptor } from './interceptors/budget-timing.interceptor';
import {
  CreateBudgetCategoryDto,
  CreateBudgetItemDto,
  UpdateBudgetCategoryDto,
  UpdateBudgetItemDto,
} from './dto/budget.dto';

@ApiTags('Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budget')
@UseInterceptors(BudgetTimingInterceptor)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get('categories')
  @ApiOperation({ summary: '예산 카테고리 목록 조회' })
  getCategories(@Req() req: Request) {
    const companyId = (req as any)?.user?.companyId;
    return this.budgetService.getCategories(companyId);
  }

  @Post('categories')
  @ApiOperation({ summary: '예산 카테고리 생성' })
  createCategory(@Req() req: Request, @Body() dto: CreateBudgetCategoryDto) {
    const companyId = (req as any)?.user?.companyId;
    return this.budgetService.createCategory(dto, companyId);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: '예산 카테고리 수정' })
  updateCategory(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateBudgetCategoryDto) {
    const companyId = (req as any)?.user?.companyId;
    return this.budgetService.updateCategory(id, dto, companyId);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '예산 카테고리 삭제' })
  deleteCategory(@Req() req: Request, @Param('id') id: string) {
    const companyId = (req as any)?.user?.companyId;
    return this.budgetService.deleteCategory(id, companyId);
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: '프로젝트 예산 조회' })
  getProjectBudget(@Req() req: Request, @Param('projectId') projectId: string) {
    const companyId = (req as any)?.user?.companyId;
    return this.budgetService.getProjectBudget(projectId, companyId);
  }

  @Post('projects/:projectId/initialize')
  @ApiOperation({ summary: '프로젝트 예산 기본 카테고리 초기화' })
  initializeProjectBudget(@Req() req: Request, @Param('projectId') projectId: string) {
    const companyId = (req as any)?.user?.companyId;
    return this.budgetService.initializeProjectBudget(projectId, companyId);
  }

  @Post('projects/:projectId/items')
  @ApiOperation({ summary: '프로젝트 예산 품목 추가' })
  addBudgetItem(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body() dto: CreateBudgetItemDto,
  ) {
    const companyId = (req as any)?.user?.companyId;
    return this.budgetService.addBudgetItem(projectId, dto, companyId);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: '프로젝트 예산 품목 수정' })
  updateBudgetItem(@Param('id') id: string, @Body() dto: UpdateBudgetItemDto) {
    return this.budgetService.updateBudgetItem(id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '프로젝트 예산 품목 삭제' })
  deleteBudgetItem(@Param('id') id: string) {
    return this.budgetService.deleteBudgetItem(id);
  }
}
