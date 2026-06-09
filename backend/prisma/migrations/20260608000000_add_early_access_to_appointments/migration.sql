-- CreateEnum
CREATE TYPE "EarlyAccessStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "appointments"
  ADD COLUMN "early_access_status"         "EarlyAccessStatus",
  ADD COLUMN "early_access_requested_at"   TIMESTAMP(3),
  ADD COLUMN "early_access_responded_at"   TIMESTAMP(3);
