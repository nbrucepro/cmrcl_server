/*
  Warnings:

  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `adminId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `ExpenseSummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `Expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `PurchaseSummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `Purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `Sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `SalesSummary` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Category_name_key";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExpenseSummary" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseSummary" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Purchases" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sales" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SalesSummary" ADD COLUMN     "adminId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Users";

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchases" ADD CONSTRAINT "Purchases_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesSummary" ADD CONSTRAINT "SalesSummary_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseSummary" ADD CONSTRAINT "PurchaseSummary_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSummary" ADD CONSTRAINT "ExpenseSummary_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("adminId") ON DELETE RESTRICT ON UPDATE CASCADE;
