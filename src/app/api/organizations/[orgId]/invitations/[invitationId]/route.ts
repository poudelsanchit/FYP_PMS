/**
 * GET    /api/organizations/[orgId]/invitations/[invitationId]  – get organization invitation
 * DELETE /api/organizations/[orgId]/invitations/[invitationId]  – cancel organization invitation
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";

interface Context {
  params: Promise<{ orgId: string; invitationId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, invitationId } = await params;

  const orgMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!orgMember) return err("Forbidden", 403);

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id: invitationId, organizationId: orgId },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (!invitation) return err("Invitation not found", 404);

  return ok(invitation);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, invitationId } = await params;

  const orgMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  if (!orgMember) return err("Forbidden", 403);

  // Only ORG_ADMIN can cancel invitations
  if (orgMember.role !== "ORG_ADMIN") {
    return err("Forbidden: only organization admins can cancel invitations", 403);
  }

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id: invitationId, organizationId: orgId },
  });
  if (!invitation) return err("Invitation not found", 404);

  if (invitation.acceptedAt)
    return err("Cannot cancel an already accepted invitation");

  await prisma.organizationInvitation.delete({ where: { id: invitationId } });

  return ok({ message: "Invitation cancelled" });
}
