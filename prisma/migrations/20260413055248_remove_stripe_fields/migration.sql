/*
  Warnings:

  - You are about to drop the column `stripeCurrentPeriodEnd` on the `organization_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `organization_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `organization_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `organization_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the `MeetingParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MeetingRoom` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_roomId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipant" DROP CONSTRAINT "MeetingParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingRoom" DROP CONSTRAINT "MeetingRoom_createdById_fkey";

-- DropForeignKey
ALTER TABLE "MeetingRoom" DROP CONSTRAINT "MeetingRoom_organizationId_fkey";

-- DropIndex
DROP INDEX "organization_subscriptions_stripeCustomerId_idx";

-- DropIndex
DROP INDEX "organization_subscriptions_stripeCustomerId_key";

-- DropIndex
DROP INDEX "organization_subscriptions_stripeSubscriptionId_idx";

-- DropIndex
DROP INDEX "organization_subscriptions_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "organization_subscriptions" DROP COLUMN "stripeCurrentPeriodEnd",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripePriceId",
DROP COLUMN "stripeSubscriptionId";

-- DropTable
DROP TABLE "MeetingParticipant";

-- DropTable
DROP TABLE "MeetingRoom";
