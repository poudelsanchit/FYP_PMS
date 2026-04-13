-- AlterTable
ALTER TABLE "Column" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3);

-- DropEnum
DROP TYPE "BoardRole" CASCADE;
