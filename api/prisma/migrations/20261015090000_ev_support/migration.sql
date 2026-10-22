-- 전기차 지원: 1단 감속기 미션 종류 + 내연기관 전용 본넷 포인트 표시.

-- AlterEnum
ALTER TYPE "Transmission" ADD VALUE 'REDUCER';

-- AlterTable
ALTER TABLE "InspectionPoint" ADD COLUMN "iceOnly" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: 이미 들어 있는 공통 포인트 중 전기차에는 없는 곳
UPDATE "InspectionPoint" SET "iceOnly" = true WHERE "carModelId" IS NULL AND "title" IN ('엔진오일', '엔진 누유', '벨트');
