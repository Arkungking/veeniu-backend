/*
  Warnings:

  - The `category` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `location` column on the `events` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `discountPct` on the `vouchers` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "imageUrl" TEXT NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'MUSIC',
DROP COLUMN "location",
ADD COLUMN     "location" "Location" NOT NULL DEFAULT 'JAKARTA',
ALTER COLUMN "availableSeats" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vouchers" DROP COLUMN "discountPct",
ADD COLUMN     "value" INTEGER NOT NULL;
