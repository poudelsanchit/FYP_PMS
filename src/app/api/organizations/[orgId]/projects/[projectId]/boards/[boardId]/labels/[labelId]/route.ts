/**
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/labels/[labelId]
 * DELETE /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/labels/[labelId]
 *
 * PATCH body: { name?: string, color?: string }
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
    labelId: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, labelId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const label = await prisma.label.findFirst({
    where: { id: labelId, boardId },
  });
  if (!label) return err("Label not found", 404);

  const body = await req.json();
  const { name, color } = body;

  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code");

  if (name?.trim() && name.trim() !== label.name) {
    const conflict = await prisma.label.findUnique({
      where: { boardId_name: { boardId, name: name.trim() } },
    });
    if (conflict)
      return err("A label with this name already exists on this board");
  }

  const updated = await prisma.label.update({
    where: { id: labelId },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(color !== undefined && { color: color ?? null }),
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, labelId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const label = await prisma.label.findFirst({
    where: { id: labelId, boardId },
  });
  if (!label) return err("Label not found", 404);

  await prisma.label.delete({ where: { id: labelId } });
  return ok({ message: "Label deleted" });
}
