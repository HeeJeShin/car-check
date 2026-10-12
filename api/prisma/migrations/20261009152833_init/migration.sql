-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('DRAFT', 'VERIFIED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "CarModel" (
    "id" SERIAL NOT NULL,
    "maker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generation" TEXT NOT NULL,
    "yearFrom" INTEGER NOT NULL,
    "yearTo" INTEGER,
    "aliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarIssue" (
    "id" SERIAL NOT NULL,
    "carModelId" INTEGER NOT NULL,
    "engine" TEXT,
    "part" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "checkHow" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "status" "IssueStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarModel_name_idx" ON "CarModel"("name");

-- CreateIndex
CREATE INDEX "CarIssue_carModelId_idx" ON "CarIssue"("carModelId");

-- AddForeignKey
ALTER TABLE "CarIssue" ADD CONSTRAINT "CarIssue_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
