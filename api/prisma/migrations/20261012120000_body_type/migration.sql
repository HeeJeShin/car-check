-- 차 종류(SUV·세단·경차) 분류 추가.
-- 이미 들어 있는 행이 있어서, 기본값으로 컬럼을 만든 뒤 차급(segment) 글자로 채우고 기본값을 지웁니다.
-- (필수 컬럼을 그냥 추가하면 기존 행 때문에 마이그레이션이 실패합니다)

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('SEDAN', 'SUV', 'LIGHT', 'VAN');

-- AlterTable
ALTER TABLE "CarModel" ADD COLUMN "bodyType" "BodyType" NOT NULL DEFAULT 'SEDAN';

-- Backfill
UPDATE "CarModel" SET "bodyType" = 'LIGHT' WHERE "segment" LIKE '%경%';
UPDATE "CarModel" SET "bodyType" = 'SUV' WHERE "segment" LIKE '%SUV%' AND "segment" NOT LIKE '%경%';

ALTER TABLE "CarModel" ALTER COLUMN "bodyType" DROP DEFAULT;
