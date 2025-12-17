// apps/api/src/budget/budget.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VendorRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBudgetCategoryDto,
  CreateBudgetItemDto,
  UpdateBudgetItemDto,
} from './dto/budget.dto';

@Injectable()
export class BudgetService {
  private readonly defaultBudgetCategories: Array<{ name: string; vendorRole: VendorRole; order: number }> = [
    { name: '구조물 자재/시공', vendorRole: VendorRole.structure, order: 1 },
    { name: '전기공사', vendorRole: VendorRole.electrical, order: 2 },
    { name: '전기설계', vendorRole: VendorRole.electrical_design, order: 3 },
    { name: '구조검토', vendorRole: VendorRole.structural_review, order: 4 },
    { name: 'EPC', vendorRole: VendorRole.epc, order: 5 },
    { name: '유지보수', vendorRole: VendorRole.om, order: 6 },
    { name: '금융비용', vendorRole: VendorRole.finance, order: 7 },
    { name: '기타', vendorRole: VendorRole.other, order: 8 },
  ];

  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompanyId(optionalCompanyId?: string): Promise<string> {
    if (optionalCompanyId) return optionalCompanyId;

    let company = await this.prisma.company.findFirst();

    if (!company) {
      company = await this.prisma.company.create({
        data: { name: 'Local Dev Company' },
      });
    }

    return company.id;
  }

  private async ensureProject(projectId: string, companyId?: string) {
    const where: Prisma.ProjectWhereInput = { id: projectId, deletedAt: null };
    if (companyId) {
      where.companyId = companyId;
    }

    const project = await this.prisma.project.findFirst({ where });
    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    return new Prisma.Decimal(value).toNumber();
  }

  async getCategories(companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    return this.ensureDefaultCategories(resolvedCompanyId);
  }

  async createCategory(dto: CreateBudgetCategoryDto, companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);

    const maxOrder = await this.prisma.budgetCategory.aggregate({
      where: { companyId: resolvedCompanyId, deletedAt: null },
      _max: { order: true },
    });

    return this.prisma.budgetCategory.create({
      data: {
        name: dto.name,
        vendorRole: dto.vendorRole ?? null,
        isDefault: dto.isDefault ?? false,
        order: dto.order ?? (maxOrder._max.order || 0) + 1,
        companyId: resolvedCompanyId,
      },
    });
  }

  async deleteCategory(id: string, companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    const category = await this.prisma.budgetCategory.findFirst({
      where: { id, companyId: resolvedCompanyId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    return this.prisma.budgetCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getProjectBudget(projectId: string, companyId?: string) {
    const project = await this.ensureProject(projectId, companyId);

    const [items, projectVendors] = await Promise.all([
      this.prisma.projectBudgetItem.findMany({
        where: { projectId: project.id, deletedAt: null },
        include: { category: true, vendorOverride: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.projectVendor.findMany({
        where: { projectId: project.id, deletedAt: null },
        include: { vendor: true },
      }),
    ]);

    const mapped = items.map((item) => {
      const vendorFromRole = projectVendors.find(
        (pv) => pv.role === (item.category?.vendorRole as VendorRole | null),
      );

      const vendor = item.vendorOverride ?? vendorFromRole?.vendor ?? null;

      return {
        id: item.id,
        projectId: item.projectId,
        categoryId: item.categoryId,
        contractAmount: this.toNumber(item.contractAmount),
        plannedAmount: this.toNumber(item.plannedAmount),
        actualAmount: this.toNumber(item.actualAmount),
        vendorId: vendor?.id ?? null,
        category: item.category,
        vendor,
      };
    });

    const contractTotal = mapped.reduce((sum, item) => sum + this.toNumber(item.contractAmount), 0);
    const plannedTotal = mapped.reduce((sum, item) => sum + this.toNumber(item.plannedAmount), 0);
    const actualTotal = mapped.reduce((sum, item) => sum + this.toNumber(item.actualAmount), 0);

    return {
      items: mapped,
      contractTotal,
      plannedTotal,
      actualTotal,
      actualProfit: contractTotal - actualTotal,
    };
  }

  async initializeProjectBudget(projectId: string, companyId?: string) {
    const project = await this.ensureProject(projectId, companyId);

    await this.prisma.$transaction(async (tx) => {
      const defaultCategories = await this.ensureDefaultCategories(project.companyId, tx);

      const existingItems = await tx.projectBudgetItem.findMany({
        where: { projectId: project.id, deletedAt: null },
        select: { categoryId: true },
      });

      const existingCategoryIds = new Set(existingItems.map((item) => item.categoryId));
      const missingCategories = defaultCategories.filter((category) => !existingCategoryIds.has(category.id));

      if (missingCategories.length) {
        await tx.projectBudgetItem.createMany({
          data: missingCategories.map((category) => ({
            projectId: project.id,
            categoryId: category.id,
            contractAmount: new Prisma.Decimal(0),
            plannedAmount: new Prisma.Decimal(0),
            actualAmount: new Prisma.Decimal(0),
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.getProjectBudget(projectId, companyId);
  }

  async addBudgetItem(projectId: string, dto: CreateBudgetItemDto, companyId?: string) {
    const project = await this.ensureProject(projectId, companyId);

    const category = await this.prisma.budgetCategory.findFirst({
      where: { id: dto.categoryId, companyId: project.companyId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('카테고리를 찾을 수 없습니다.');
    }

    const existing = await this.prisma.projectBudgetItem.findFirst({
      where: { projectId: project.id, categoryId: dto.categoryId, deletedAt: null },
    });

    if (existing) {
      throw new BadRequestException('이미 추가된 카테고리입니다.');
    }

    return this.prisma.projectBudgetItem.create({
      data: {
        projectId: project.id,
        categoryId: dto.categoryId,
        contractAmount:
          dto.contractAmount !== undefined ? new Prisma.Decimal(dto.contractAmount) : new Prisma.Decimal(0),
        plannedAmount:
          dto.plannedAmount !== undefined ? new Prisma.Decimal(dto.plannedAmount) : new Prisma.Decimal(0),
        actualAmount:
          dto.actualAmount !== undefined ? new Prisma.Decimal(dto.actualAmount) : new Prisma.Decimal(0),
      },
      include: { category: true },
    });
  }

  async updateBudgetItem(id: string, dto: UpdateBudgetItemDto) {
    const item = await this.prisma.projectBudgetItem.findFirst({ where: { id, deletedAt: null } });

    if (!item) {
      throw new NotFoundException('예산 품목을 찾을 수 없습니다.');
    }

    return this.prisma.projectBudgetItem.update({
      where: { id },
      data: {
        contractAmount:
          dto.contractAmount !== undefined ? new Prisma.Decimal(dto.contractAmount) : undefined,
        plannedAmount: dto.plannedAmount !== undefined ? new Prisma.Decimal(dto.plannedAmount) : undefined,
        actualAmount: dto.actualAmount !== undefined ? new Prisma.Decimal(dto.actualAmount) : undefined,
      },
      include: { category: true, vendorOverride: true },
    });
  }

  async deleteBudgetItem(id: string) {
    const item = await this.prisma.projectBudgetItem.findFirst({ where: { id, deletedAt: null } });

    if (!item) {
      throw new NotFoundException('예산 품목을 찾을 수 없습니다.');
    }

    return this.prisma.projectBudgetItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async ensureDefaultCategories(
    companyId: string,
    tx: Pick<PrismaService, 'budgetCategory'> | Prisma.TransactionClient = this.prisma,
  ) {
    const categories = await tx.budgetCategory.findMany({
      where: { companyId, isDefault: true, deletedAt: null },
      orderBy: { order: 'asc' },
    });

    if (categories.length > 0) {
      return categories;
    }

    await tx.budgetCategory.createMany({
      data: this.defaultBudgetCategories.map((category) => ({
        ...category,
        companyId,
        isDefault: true,
      })),
      skipDuplicates: true,
    });

    return tx.budgetCategory.findMany({
      where: { companyId, isDefault: true, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }
}
