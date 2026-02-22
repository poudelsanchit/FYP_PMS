/**
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/priorities/[priorityId]
 * DELETE /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/priorities/[priorityId]
 *
 * PATCH body: { name?: string, color?: string, order?: number }
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
    priorityId: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, priorityId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const priority = await prisma.priority.findFirst({
    where: { id: priorityId, boardId },
  });
  if (!priority) return err("Priority not found", 404);

  const body = await req.json();
  const { name, color, order } = body;

  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code");

  if (name?.trim() && name.trim() !== priority.name) {
    const conflict = await prisma.priority.findUnique({
      where: { boardId_name: { boardId, name: name.trim() } },
    });
    if (conflict)
      return err("A priority with this name already exists on this board");
  }

  const updated = await prisma.priority.update({
    where: { id: priorityId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(color !== undefined && { color: color ?? null }),
      ...(order !== undefined && { order }),
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, priorityId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const priority = await prisma.priority.findFirst({
    where: { id: priorityId, boardId },
  });
  if (!priority) return err("Priority not found", 404);

  await prisma.priority.delete({ where: { id: priorityId } });
  return ok({ message: "Priority deleted" });
}
