/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/columns
 * POST /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/columns
 *
 * POST body: { name: string, order?: number }
 * If order is omitted, the column is appended after the current last column.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, ok } from "@/core/lib/api/api";
import {
  canManageBoard,
  resolveBoardAccess,
} from "@/core/lib/api/board-access";
interface Context {
  params: Promise<{ orgId: string; projectId: string; boardId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const columns = await prisma.column.findMany({
    where: { boardId },
    include: { _count: { select: { issues: true } } },
    orderBy: { order: "asc" },
  });

  return ok(columns);
}

export async function POST(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.projectMember))
    return err("Forbidden: insufficient role", 403);

  const body = await req.json();
  const { name, order } = body;

  if (!name?.trim()) return err("Column name is required");

  let resolvedOrder = order;
  if (resolvedOrder === undefined || resolvedOrder === null) {
    const last = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  const conflict = await prisma.column.findUnique({
    where: { boardId_order: { boardId, order: resolvedOrder } },
  });
  if (conflict)
    return err(`A column at position ${resolvedOrder} already exists`);

  const column = await prisma.column.create({
    data: { boardId, name: name.trim(), order: resolvedOrder },
  });

  return ok(column, 201);
}
