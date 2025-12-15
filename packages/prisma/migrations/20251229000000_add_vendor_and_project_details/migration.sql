-- CreateEnum
CREATE TYPE "VendorRole" AS ENUM ('structure', 'electrical', 'electrical_design', 'structural_review', 'epc', 'om', 'finance', 'other');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "businessLicenseNo" TEXT,
ADD COLUMN     "devPermitNo" TEXT,
ADD COLUMN     "farmlandPermitNo" TEXT,
ADD COLUMN     "kepcoReceiptNo" TEXT,
ADD COLUMN     "landAddress" TEXT,
ADD COLUMN     "landLeaseRate" DECIMAL(12,2),
ADD COLUMN     "landOwner" TEXT,
ADD COLUMN     "ppaPrice" DECIMAL(12,2),
ADD COLUMN     "siteAccessCode" TEXT,
ADD COLUMN     "siteNote" TEXT,
ADD COLUMN     "sitePassword" TEXT;

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "bizNo" TEXT,
    "bankAccount" TEXT,
    "address" TEXT,
    "memo" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_vendors" (
    "id" TEXT NOT NULL,
    "role" "VendorRole" NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "memo" TEXT,
    "deletedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_deletedAt_idx" ON "vendors"("deletedAt");

-- CreateIndex
CREATE INDEX "project_vendors_projectId_idx" ON "project_vendors"("projectId");

-- CreateIndex
CREATE INDEX "project_vendors_vendorId_idx" ON "project_vendors"("vendorId");

-- CreateIndex
CREATE INDEX "project_vendors_deletedAt_idx" ON "project_vendors"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "project_vendors_projectId_role_key" ON "project_vendors"("projectId", "role");

-- AddForeignKey
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_vendors" ADD CONSTRAINT "project_vendors_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

