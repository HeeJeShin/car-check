-- CreateTable
CREATE TABLE "IssueReport" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "reasons" TEXT[],
    "comment" TEXT,
    "sourceUrl" TEXT,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "answeredById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueReport_issueId_createdAt_idx" ON "IssueReport"("issueId", "createdAt");

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CarIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
