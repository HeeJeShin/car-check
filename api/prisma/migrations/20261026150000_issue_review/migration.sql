-- 고질병 심사 흐름(검토 요청·반려) + 변경 이력

-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IssueStatus" ADD VALUE 'IN_REVIEW';
ALTER TYPE "IssueStatus" ADD VALUE 'REJECTED';

-- CreateTable
CREATE TABLE "IssueHistory" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "action" "HistoryAction" NOT NULL,
    "fromStatus" "IssueStatus",
    "toStatus" "IssueStatus",
    "reason" TEXT,
    "changes" JSONB,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueHistory_issueId_createdAt_idx" ON "IssueHistory"("issueId", "createdAt");

-- AddForeignKey
ALTER TABLE "IssueHistory" ADD CONSTRAINT "IssueHistory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CarIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueHistory" ADD CONSTRAINT "IssueHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

