/*
  Warnings:

  - You are about to drop the `organization_subscriptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "organization_subscriptions" DROP CONSTRAINT "organization_subscriptions_organizationId_fkey";

-- DropTable
DROP TABLE "organization_subscriptions";

-- DropEnum
DROP TYPE "PlanTier";

-- DropEnum
DROP TYPE "SubscriptionStatus";
