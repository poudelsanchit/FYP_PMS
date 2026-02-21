/**
 * GET /api/organizations/[orgId]/projects/[projectId]/members/me - Get current user's project role
 */

import { NextRequest } from "next/server";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";

interface Context {
  params: Promise<{ orgId: string; projectId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;

  const orgMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!orgMember) return err("Forbidden", 403);

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) return err("Project not found", 404);

  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!projectMember) {
    return ok({ role: null, isMember: false });
  }

  return ok({ role: projectMember.role, isMember: true });
}
