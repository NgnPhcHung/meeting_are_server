/*
  Warnings:

  - You are about to drop the column `ownerId` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `rooms` table. All the data in the column will be lost.
  - Added the required column `owner_id` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_user_id_fkey";

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "ownerId",
DROP COLUMN "user_id",
ADD COLUMN     "owner_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
