/**
 * DELETE /api/organizations/[orgId]/projects/[projectId]/invitations/[invitationId]  – cancel invitation
 */

import { NextRequest } from "next/server";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";

interface Context {
  params: Promise<{ orgId: string; projectId: string; invitationId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId, invitationId } = await params;

  const [orgMember, projectMember] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);

  if (!orgMember) return err("Forbidden", 403);

  const canManage =
    projectMember?.role === "PROJECT_LEAD" || orgMember.role === "ORG_ADMIN";
  if (!canManage) return err("Forbidden: insufficient role", 403);

  const invitation = await prisma.projectInvitation.findFirst({
    where: { id: invitationId, projectId },
  });
  if (!invitation) return err("Invitation not found", 404);

  await prisma.projectInvitation.delete({ where: { id: invitationId } });

  return ok({ message: "Invitation cancelled" });
}
