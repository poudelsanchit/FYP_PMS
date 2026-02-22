/**
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/members/[memberId]
 * DELETE /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/members/[memberId]
 *
 * PATCH body: { role: "BOARD_LEAD" | "BOARD_MEMBER" | "BOARD_VIEWER" }
 * DELETE: self-removal is always allowed; removing others requires BOARD_LEAD or ORG_ADMIN
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, ok } from "@/core/lib/api/api";
import {
  canManageBoard,
  resolveBoardAccess,
} from "@/core/lib/api/board-access";

interface Context {
  params: Promise<{
    orgId: string;
    projectId: string;
    boardId: string;
    memberId: string;
  }>;
}

const VALID_ROLES = ["BOARD_LEAD", "BOARD_MEMBER", "BOARD_VIEWER"] as const;

export async function PATCH(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, memberId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const target = await prisma.boardMember.findFirst({
    where: { id: memberId, boardId },
  });
  if (!target) return err("Member not found", 404);

  const body = await req.json();
  const { role } = body;
  if (!VALID_ROLES.includes(role))
    return err(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);

  const updated = await prisma.boardMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, memberId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const target = await prisma.boardMember.findFirst({
    where: { id: memberId, boardId },
  });
  if (!target) return err("Member not found", 404);

  const isSelf = target.userId === access.userId;
  if (!isSelf && !canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  await prisma.boardMember.delete({ where: { id: memberId } });
  return ok({ message: "Member removed" });
}
