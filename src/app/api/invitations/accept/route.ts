/**
 * POST /api/invitations/accept
 *
 * Body: { token: string }
 *
 * Accepts a project invitation using the unique token from the invitation email.
 * The authenticated user must match the invited user.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json();
  const { token } = body;

  if (!token?.trim()) return err("Invitation token is required");

  const invitation = await prisma.projectInvitation.findUnique({
    where: { token },
    include: {
      project: { select: { id: true, name: true, organizationId: true } },
    },
  });

  if (!invitation) return err("Invalid or expired invitation token", 404);
  if (invitation.userId !== userId)
    return err("This invitation is not for you", 403);
  if (invitation.acceptedAt) return err("Invitation has already been accepted");
  if (invitation.expiresAt < new Date()) return err("Invitation has expired");

  // Ensure the project still exists
  if (!invitation.project) return err("The project no longer exists", 404);

  const { projectId, role } = invitation;

  // Use a transaction to mark accepted + create member atomically
  const [projectMember] = await prisma.$transaction([
    prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: projectId!, userId } },
      create: { projectId: projectId!, userId, role },
      update: { role }, // update role if re-accepting
    }),
    prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return ok({
    message: "Invitation accepted",
    projectMember,
    project: invitation.project,
  });
}
