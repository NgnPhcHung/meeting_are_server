/*
  Warnings:

  - Added the required column `room_name` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "room_name" TEXT NOT NULL;
