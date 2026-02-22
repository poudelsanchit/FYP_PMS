/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/members
 * POST /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/members
 *
 * POST body: { userId: string, role: "BOARD_LEAD" | "BOARD_MEMBER" | "BOARD_VIEWER" }
 *
 * The user being added must already be a project member.
 */

import { NextRequest } from "next/server";
import { err, ok } from "@/core/lib/api/api";
import {
  canManageBoard,
  resolveBoardAccess,
} from "@/core/lib/api/board-access";
import { prisma } from "@/core/lib/prisma/prisma";

interface Context {
  params: Promise<{ orgId: string; projectId: string; boardId: string }>;
}

const VALID_ROLES = ["BOARD_LEAD", "BOARD_MEMBER", "BOARD_VIEWER"] as const;

export async function GET(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return ok(members);
}

export async function POST(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const body = await req.json();
  const { userId: inviteeId, role } = body;

  if (!inviteeId) return err("userId is required");
  if (!VALID_ROLES.includes(role))
    return err(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);

  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: inviteeId } },
  });
  if (!projectMember) return err("User is not a member of this project");

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: inviteeId } },
  });
  if (existing) return err("User is already a board member");

  const member = await prisma.boardMember.create({
    data: { boardId, userId: inviteeId, role },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  return ok(member, 201);
}
