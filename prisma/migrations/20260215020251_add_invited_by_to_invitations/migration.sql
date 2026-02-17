-- AlterTable
ALTER TABLE "OrganizationInvitation" ADD COLUMN     "invitedById" TEXT;

-- CreateIndex
CREATE INDEX "OrganizationInvitation_invitedById_idx" ON "OrganizationInvitation"("invitedById");

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
