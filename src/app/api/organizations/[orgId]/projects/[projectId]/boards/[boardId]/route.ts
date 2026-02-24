import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import {
  canManageBoard,
  resolveBoardAccess,
} from "@/core/lib/api/board-access";

interface Context {
  params: Promise<{ orgId: string; projectId: string; boardId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId, boardId } = await params;

  const orgMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!orgMember) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const includeColumns = searchParams.get("includeColumns") === "true";
  const includeProject = searchParams.get("includeProject") === "true";

  const board = await prisma.board.findFirst({
    where: { id: boardId, projectId, organizationId: orgId },
    include: {
      ...(includeColumns && { columns: { orderBy: { order: "asc" } } }),
      ...(includeProject && { project: { select: { id: true, name: true } } }),
      _count: { select: { columns: true } },
    },
  });

  if (!board) return err("Board not found", 404);
  return ok(board);
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.projectMember))
    return err("Forbidden: insufficient role", 403);

  const body = await req.json();
  const { name } = body;
  if (!name?.trim()) return err("Board name is required");

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { name: name.trim() },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.projectMember))
    return err("Forbidden: insufficient role", 403);

  await prisma.board.delete({ where: { id: boardId } });
  return ok({ message: "Board deleted" });
}
