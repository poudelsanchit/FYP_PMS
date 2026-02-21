/**
 * GET    /api/organizations/[orgId]/projects/[projectId]/members         – list members
 * DELETE /api/organizations/[orgId]/projects/[projectId]/members/[memberId] – remove member
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/members/[memberId] – update role
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

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return ok(members);
}
