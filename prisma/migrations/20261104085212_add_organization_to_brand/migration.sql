/*
  Warnings:

  - You are about to alter the column `unitCost` on the `ProductSupplier` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `costPrice` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `sellingPrice` on the `ProductVariant` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `unitCost` on the `PurchaseOrderItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to alter the column `unitCost` on the `PurchaseReceiptItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - You are about to drop the column `supplierId` on the `PurchaseReturn` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `PurchaseReturnItem` table. All the data in the column will be lost.
  - You are about to alter the column `unitCost` on the `PurchaseReturnItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(15,2)`.
  - A unique constraint covering the columns `[code,organizationId]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,code]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,code]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,code]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,code]` on the table `ProductAttribute` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[purchaseReturnId,purchaseReceiptItemId]` on the table `PurchaseReturnItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,taxCode]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,code]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `ProductAttribute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseReceiptItemId` to the `PurchaseReturnItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PurchaseReturn" DROP CONSTRAINT "PurchaseReturn_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseReturnItem" DROP CONSTRAINT "PurchaseReturnItem_variantId_fkey";

-- DropIndex
DROP INDEX "Brand_code_key";

-- DropIndex
DROP INDEX "Category_code_key";

-- DropIndex
DROP INDEX "Customer_code_key";

-- DropIndex
DROP INDEX "Product_code_key";

-- DropIndex
DROP INDEX "ProductAttribute_code_key";

-- DropIndex
DROP INDEX "ProductVariant_barcode_idx";

-- DropIndex
DROP INDEX "PurchaseReturn_supplierId_idx";

-- DropIndex
DROP INDEX "PurchaseReturnItem_purchaseReturnId_variantId_key";

-- DropIndex
DROP INDEX "Supplier_code_key";

-- DropIndex
DROP INDEX "Supplier_taxCode_key";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ProductAttribute" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ProductSupplier" ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "ProductVariant" ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "sellingPrice" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "PurchaseReceiptItem" ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "PurchaseReturn" DROP COLUMN "supplierId",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT;

-- AlterTable
ALTER TABLE "PurchaseReturnItem" DROP COLUMN "variantId",
ADD COLUMN     "purchaseReceiptItemId" TEXT NOT NULL,
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(15,2);

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "organizationId" TEXT;

-- Backfill organizationId for existing rows with the NOVA organization
UPDATE "Brand"
SET "organizationId" = (SELECT id FROM "Organization" WHERE code = 'NOVA')
WHERE "organizationId" IS NULL;

UPDATE "Category"
SET "organizationId" = (SELECT id FROM "Organization" WHERE code = 'NOVA')
WHERE "organizationId" IS NULL;

UPDATE "Customer"
SET "organizationId" = (SELECT id FROM "Organization" WHERE code = 'NOVA')
WHERE "organizationId" IS NULL;

UPDATE "Product"
SET "organizationId" = (SELECT id FROM "Organization" WHERE code = 'NOVA')
WHERE "organizationId" IS NULL;

UPDATE "ProductAttribute"
SET "organizationId" = (SELECT id FROM "Organization" WHERE code = 'NOVA')
WHERE "organizationId" IS NULL;

UPDATE "Supplier"
SET "organizationId" = (SELECT id FROM "Organization" WHERE code = 'NOVA')
WHERE "organizationId" IS NULL;

-- Enforce NOT NULL once existing rows are backfilled
ALTER TABLE "Brand" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ProductAttribute" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_organizationId_key" ON "Brand"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_organizationId_code_key" ON "Category"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_code_key" ON "Customer"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organizationId_code_key" ON "Product"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAttribute_organizationId_code_key" ON "ProductAttribute"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON "ProductVariant"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturnItem_purchaseReturnId_purchaseReceiptItemId_key" ON "PurchaseReturnItem"("purchaseReturnId", "purchaseReceiptItemId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_taxCode_key" ON "Supplier"("organizationId", "taxCode");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_code_key" ON "Supplier"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnItem" ADD CONSTRAINT "PurchaseReturnItem_purchaseReceiptItemId_fkey" FOREIGN KEY ("purchaseReceiptItemId") REFERENCES "PurchaseReceiptItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
