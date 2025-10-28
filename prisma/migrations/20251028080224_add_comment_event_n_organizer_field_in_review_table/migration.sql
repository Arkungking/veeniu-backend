/*
  Warnings:

  - You are about to drop the column `comment` on the `reviews` table. All the data in the column will be lost.
  - Added the required column `commentEvent` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commentOrganizer` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "comment",
ADD COLUMN     "commentEvent" TEXT NOT NULL,
ADD COLUMN     "commentOrganizer" TEXT NOT NULL;
