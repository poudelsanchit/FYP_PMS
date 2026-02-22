/**
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/labels/[labelId]
 * DELETE /api/organizations/[orgId]/projects/[projectId]/labels/[labelId]
 *
 * PATCH body: { name?: string, color?: string }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";

interface Context {
  params: Promise<{ orgId: string; projectId: string; labelId: string }>;
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

  const { orgId, projectId, labelId } = await params;
  const { orgMember, projectMember } = await resolveAccess(
    userId,
    orgId,
    projectId,
  );
  if (!orgMember) return err("Forbidden", 403);

  const canManage =
    orgMember.role === "ORG_ADMIN" || projectMember?.role === "PROJECT_LEAD";
  if (!canManage) return err("Forbidden: insufficient role", 403);

  const label = await prisma.projectLabel.findFirst({
    where: { id: labelId, projectId },
  });
  if (!label) return err("Label not found", 404);

  const body = await req.json();
  const { name, color } = body;

  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code");

  if (name?.trim() && name.trim() !== label.name) {
    const conflict = await prisma.projectLabel.findUnique({
      where: { projectId_name: { projectId, name: name.trim() } },
    });
    if (conflict)
      return err("A label with this name already exists in this project");
  }

  const updated = await prisma.projectLabel.update({
    where: { id: labelId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(color !== undefined && { color }),
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId, labelId } = await params;
  const { orgMember, projectMember } = await resolveAccess(
    userId,
    orgId,
    projectId,
  );
  if (!orgMember) return err("Forbidden", 403);

  const canManage =
    orgMember.role === "ORG_ADMIN" || projectMember?.role === "PROJECT_LEAD";
  if (!canManage) return err("Forbidden: insufficient role", 403);

  const label = await prisma.projectLabel.findFirst({
    where: { id: labelId, projectId },
  });
  if (!label) return err("Label not found", 404);

  await prisma.projectLabel.delete({ where: { id: labelId } });
  return ok({ message: "Label deleted" });
}
