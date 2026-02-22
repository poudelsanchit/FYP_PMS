/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/priorities
 * POST /api/organizations/[orgId]/projects/[projectId]/priorities
 *
 * POST body: { name: string, color: string, order?: number }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";

interface Context {
  params: Promise<{ orgId: string; projectId: string }>;
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

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;
  const { orgMember } = await resolveAccess(userId, orgId, projectId);
  if (!orgMember) return err("Forbidden", 403);

  const priorities = await prisma.projectPriority.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });

  return ok(priorities);
}

export async function POST(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;
  const { orgMember, projectMember } = await resolveAccess(
    userId,
    orgId,
    projectId,
  );
  if (!orgMember) return err("Forbidden", 403);

  const canManage =
    orgMember.role === "ORG_ADMIN" || projectMember?.role === "PROJECT_LEAD";
  if (!canManage)
    return err(
      "Forbidden: only project leads or org admins can create priorities",
      403,
    );

  const body = await req.json();
  const { name, color, order } = body;

  if (!name?.trim()) return err("Priority name is required");
  if (!color) return err("Color is required");
  if (!/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code (e.g. #ef4444)");

  const existing = await prisma.projectPriority.findUnique({
    where: { projectId_name: { projectId, name: name.trim() } },
  });
  if (existing)
    return err("A priority with this name already exists in this project");

  let resolvedOrder = order;
  if (resolvedOrder === undefined || resolvedOrder === null) {
    const last = await prisma.projectPriority.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  const priority = await prisma.projectPriority.create({
    data: { projectId, name: name.trim(), color, order: resolvedOrder },
  });

  return ok(priority, 201);
}
