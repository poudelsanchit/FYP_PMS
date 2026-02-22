/**
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/priorities/[priorityId]
 * DELETE /api/organizations/[orgId]/projects/[projectId]/priorities/[priorityId]
 *
 * PATCH body: { name?: string, color?: string, order?: number }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";

interface Context {
  params: Promise<{ orgId: string; projectId: string; priorityId: string }>;
}

async function resolveAccess(userId: string, orgId: string, projectId: string) {
  const [orgMember, projectMember] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);
  return { orgMember, projectMember };
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId, priorityId } = await params;
  const { orgMember, projectMember } = await resolveAccess(
    userId,
    orgId,
    projectId,
  );
  if (!orgMember) return err("Forbidden", 403);

  const canManage =
    orgMember.role === "ORG_ADMIN" || projectMember?.role === "PROJECT_LEAD";
  if (!canManage) return err("Forbidden: insufficient role", 403);

  const priority = await prisma.projectPriority.findFirst({
    where: { id: priorityId, projectId },
  });
  if (!priority) return err("Priority not found", 404);

  const body = await req.json();
  const { name, color, order } = body;

  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code");

  if (name?.trim() && name.trim() !== priority.name) {
    const conflict = await prisma.projectPriority.findUnique({
      where: { projectId_name: { projectId, name: name.trim() } },
    });
    if (conflict)
      return err("A priority with this name already exists in this project");
  }

  const updated = await prisma.projectPriority.update({
    where: { id: priorityId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(color !== undefined && { color }),
      ...(order !== undefined && { order }),
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId, priorityId } = await params;
  const { orgMember, projectMember } = await resolveAccess(
    userId,
    orgId,
    projectId,
  );
  if (!orgMember) return err("Forbidden", 403);

  const canManage =
    orgMember.role === "ORG_ADMIN" || projectMember?.role === "PROJECT_LEAD";
  if (!canManage) return err("Forbidden: insufficient role", 403);

  const priority = await prisma.projectPriority.findFirst({
    where: { id: priorityId, projectId },
  });
  if (!priority) return err("Priority not found", 404);

  await prisma.projectPriority.delete({ where: { id: priorityId } });
  return ok({ message: "Priority deleted" });
}
