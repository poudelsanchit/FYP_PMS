/**
 * GET    /api/organizations/[orgId]/projects/[projectId]  – get project detail
 * PATCH  /api/organizations/[orgId]/projects/[projectId]  – update project
 * DELETE /api/organizations/[orgId]/projects/[projectId]  – delete project
 *
 * Query params (GET):
 *   includeMembers=true  – include project members
 */

import { NextRequest } from "next/server";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";

interface Context {
  params: Promise<{ orgId: string; projectId: string }>;
}

async function resolveProjectMembership(
  userId: string,
  orgId: string,
  projectId: string,
) {
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
  const { orgMember } = await resolveProjectMembership(
    userId,
    orgId,
    projectId,
  );
  if (!orgMember) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const includeMembers = searchParams.get("includeMembers") === "true";

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      ...(includeMembers && {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      }),
      _count: { select: { members: true } },
    },
  });

  if (!project) return err("Project not found", 404);

  return ok(project);
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;
  const { projectMember, orgMember } = await resolveProjectMembership(
    userId,
    orgId,
    projectId,
  );

  if (!orgMember) return err("Forbidden", 403);

  // Only PROJECT_LEAD or ORG_ADMIN can update
  const canEdit =
    projectMember?.role === "PROJECT_LEAD" || orgMember.role === "ORG_ADMIN";
  if (!canEdit) return err("Forbidden: insufficient role", 403);

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) return err("Project not found", 404);

  const body = await req.json();
  const { name, description, color } = body;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(description !== undefined && {
        description: description?.trim() ?? null,
      }),
      ...(color !== undefined && { color }),
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;
  const { projectMember, orgMember } = await resolveProjectMembership(
    userId,
    orgId,
    projectId,
  );

  if (!orgMember) return err("Forbidden", 403);

  // Only PROJECT_LEAD or ORG_ADMIN can delete
  const canDelete =
    projectMember?.role === "PROJECT_LEAD" || orgMember.role === "ORG_ADMIN";
  if (!canDelete) return err("Forbidden: insufficient role", 403);

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) return err("Project not found", 404);

  await prisma.project.delete({ where: { id: projectId } });

  return ok({ message: "Project deleted successfully" });
}
