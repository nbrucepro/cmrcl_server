/*
  Warnings:

  - You are about to drop the column `price` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Products` table. All the data in the column will be lost.
  - You are about to drop the column `stockQuantity` on the `Products` table. All the data in the column will be lost.
  - Made the column `stockQuantity` on table `ProductVariant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "price",
ADD COLUMN     "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "stockQuantity" SET NOT NULL,
ALTER COLUMN "stockQuantity" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Products" DROP COLUMN "price",
DROP COLUMN "stockQuantity";
