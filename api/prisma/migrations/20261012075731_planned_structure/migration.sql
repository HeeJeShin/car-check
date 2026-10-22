/*
  Warnings:

  - Added the required column `displayName` to the `CarModel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Fuel" AS ENUM ('GASOLINE', 'DIESEL', 'LPG', 'HYBRID', 'EV');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('AT', 'DCT', 'CVT', 'MT');

-- DropIndex
DROP INDEX "CarModel_name_idx";

-- AlterTable
ALTER TABLE "CarModel" ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "segment" TEXT;

-- CreateTable
CREATE TABLE "Powertrain" (
    "id" SERIAL NOT NULL,
    "carModelId" INTEGER NOT NULL,
    "engine" TEXT NOT NULL,
    "fuel" "Fuel" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "gearbox" TEXT,
    "drive" TEXT,

    CONSTRAINT "Powertrain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionPoint" (
    "id" SERIAL NOT NULL,
    "carModelId" INTEGER,
    "order" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "look" TEXT NOT NULL,
    "bad" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Powertrain_carModelId_idx" ON "Powertrain"("carModelId");

-- CreateIndex
CREATE INDEX "InspectionPoint_carModelId_idx" ON "InspectionPoint"("carModelId");

-- CreateIndex
CREATE INDEX "CarModel_maker_name_idx" ON "CarModel"("maker", "name");

-- AddForeignKey
ALTER TABLE "Powertrain" ADD CONSTRAINT "Powertrain_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionPoint" ADD CONSTRAINT "InspectionPoint_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
