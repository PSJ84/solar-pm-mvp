-- CreateTable
CREATE TABLE "budget_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendorRole" "VendorRole",
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_budget_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "vendorOverrideId" TEXT,
    "contractAmount" DECIMAL(14,0) NOT NULL DEFAULT 0,
    "plannedAmount" DECIMAL(14,0) NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL(14,0) NOT NULL DEFAULT 0,
    "memo" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_categories_companyId_name_key" ON "budget_categories"("companyId", "name");

-- CreateIndex
CREATE INDEX "budget_categories_companyId_order_idx" ON "budget_categories"("companyId", "order");

-- CreateIndex
CREATE INDEX "budget_categories_deletedAt_idx" ON "budget_categories"("deletedAt");

-- CreateIndex
CREATE INDEX "budget_categories_isDefault_idx" ON "budget_categories"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "project_budget_items_projectId_categoryId_key" ON "project_budget_items"("projectId", "categoryId");

-- CreateIndex
CREATE INDEX "project_budget_items_projectId_idx" ON "project_budget_items"("projectId");

-- CreateIndex
CREATE INDEX "project_budget_items_categoryId_idx" ON "project_budget_items"("categoryId");

-- CreateIndex
CREATE INDEX "project_budget_items_deletedAt_idx" ON "project_budget_items"("deletedAt");

-- AddForeignKey
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_budget_items" ADD CONSTRAINT "project_budget_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_budget_items" ADD CONSTRAINT "project_budget_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "budget_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_budget_items" ADD CONSTRAINT "project_budget_items_vendorOverrideId_fkey" FOREIGN KEY ("vendorOverrideId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
