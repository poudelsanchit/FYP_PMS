/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/labels
 * POST /api/organizations/[orgId]/projects/[projectId]/labels
 *
 * Project labels are a reusable catalog owned at the project level.
 *
 * POST body: { name: string, color: string }
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

  const labels = await prisma.projectLabel.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });

  return ok(labels);
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
      "Forbidden: only project leads or org admins can create labels",
      403,
    );

  const body = await req.json();
  const { name, color } = body;

  if (!name?.trim()) return err("Label name is required");
  if (!color) return err("Color is required");
  if (!/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code (e.g. #3b82f6)");

  const existing = await prisma.projectLabel.findUnique({
    where: { projectId_name: { projectId, name: name.trim() } },
  });
  if (existing)
    return err("A label with this name already exists in this project");

  const label = await prisma.projectLabel.create({
    data: { projectId, name: name.trim(), color },
  });

  return ok(label, 201);
}
