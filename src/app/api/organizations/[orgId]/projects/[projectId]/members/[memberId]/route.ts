/**
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/members/[memberId]  – update role
 * DELETE /api/organizations/[orgId]/projects/[projectId]/members/[memberId]  – remove member
 */

import { NextRequest } from "next/server";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";
import { ProjectRole } from "@/generated/prisma/enums";

interface Context {
  params: Promise<{ orgId: string; projectId: string; memberId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId, memberId } = await params;

  const [orgMember, callerMembership] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);

  if (!orgMember) return err("Forbidden", 403);

  const canManage =
    callerMembership?.role === "PROJECT_LEAD" || orgMember.role === "ORG_ADMIN";
  if (!canManage) return err("Forbidden: insufficient role", 403);

  const target = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
  });
  if (!target) return err("Member not found", 404);

  const body = await req.json();
  const { role } = body;

  const validRoles: ProjectRole[] = ["PROJECT_LEAD", "PROJECT_MEMBER"];
  if (!validRoles.includes(role)) return err("Invalid role");

  const updated = await prisma.projectMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId, memberId } = await params;

  const [orgMember, callerMembership] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);

  if (!orgMember) return err("Forbidden", 403);

  const target = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
  });
  if (!target) return err("Member not found", 404);

  // Allow self-removal OR PROJECT_LEAD/ORG_ADMIN to remove others
  const isSelf = target.userId === userId;
  const canManage =
    callerMembership?.role === "PROJECT_LEAD" || orgMember.role === "ORG_ADMIN";

  if (!isSelf && !canManage) return err("Forbidden: insufficient role", 403);

  await prisma.projectMember.delete({ where: { id: memberId } });

  return ok({ message: "Member removed" });
}
