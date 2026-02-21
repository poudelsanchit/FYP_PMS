/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/invitations  – list invitations
 * POST /api/organizations/[orgId]/projects/[projectId]/invitations  – send invitation
 *
 * POST body: { userId: string, role: ProjectRole }
 */

import { NextRequest } from "next/server";
import { addDays } from "date-fns";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";
import { ProjectRole } from "@/generated/prisma/enums";

interface Context {
  params: Promise<{ orgId: string; projectId: string }>;
}

const INVITATION_EXPIRY_DAYS = 7;

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;

  const [orgMember, projectMember] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);

  if (!orgMember) return err("Forbidden", 403);

  const canView =
    projectMember?.role === "PROJECT_LEAD" || orgMember.role === "ORG_ADMIN";
  if (!canView) return err("Forbidden: insufficient role", 403);

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status"); // "pending" | "accepted" | "expired"

  const now = new Date();

  const invitations = await prisma.projectInvitation.findMany({
    where: {
      projectId,
      ...(statusFilter === "pending" && {
        acceptedAt: null,
        expiresAt: { gt: now },
      }),
      ...(statusFilter === "accepted" && { acceptedAt: { not: null } }),
      ...(statusFilter === "expired" && {
        acceptedAt: null,
        expiresAt: { lte: now },
      }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(invitations);
}

export async function POST(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;

  const [orgMember, projectMember] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);

  if (!orgMember) return err("Forbidden", 403);

  const canInvite =
    projectMember?.role === "PROJECT_LEAD" || orgMember.role === "ORG_ADMIN";
  if (!canInvite) return err("Forbidden: insufficient role", 403);

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
  });
  if (!project) return err("Project not found", 404);

  const body = await req.json();
  const { userId: inviteeId, role } = body;

  if (!inviteeId) return err("userId is required");

  const validRoles: ProjectRole[] = ["PROJECT_LEAD", "PROJECT_MEMBER"];
  if (!validRoles.includes(role)) return err("Invalid role");

  // Invitee must be an org member
  const inviteeOrgMember = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: { userId: inviteeId, organizationId: orgId },
    },
  });
  if (!inviteeOrgMember)
    return err("User is not a member of this organization");

  // Already a project member?
  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: inviteeId } },
  });
  if (alreadyMember) return err("User is already a project member");

  // Upsert invitation (re-invite if expired)
  const invitation = await prisma.projectInvitation.upsert({
    where: { projectId_userId: { projectId, userId: inviteeId } },
    create: {
      projectId,
      userId: inviteeId,
      role,
      expiresAt: addDays(new Date(), INVITATION_EXPIRY_DAYS),
    },
    update: {
      role,
      acceptedAt: null,
      expiresAt: addDays(new Date(), INVITATION_EXPIRY_DAYS),
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  // TODO: Send invitation email here

  return ok(invitation, 201);
}
