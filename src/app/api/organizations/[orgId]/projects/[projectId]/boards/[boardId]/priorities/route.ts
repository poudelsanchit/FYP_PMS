/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/priorities
 * POST /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/priorities
 *
 * POST body: { name: string, color?: string, order?: number }
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

  const priorities = await prisma.priority.findMany({
    where: { boardId },
    orderBy: { order: "asc" },
  });

  return ok(priorities);
}

export async function POST(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const body = await req.json();
  const { name, color, order } = body;

  if (!name?.trim()) return err("Priority name is required");
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code (e.g. #ef4444)");

  const existing = await prisma.priority.findUnique({
    where: { boardId_name: { boardId, name: name.trim() } },
  });
  if (existing) return err("A priority with this name already exists on this board");

  let resolvedOrder = order;
  if (resolvedOrder === undefined || resolvedOrder === null) {
    const last = await prisma.priority.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  const priority = await prisma.priority.create({
    data: { boardId, name: name.trim(), color: color ?? null, order: resolvedOrder },
  });

  return ok(priority, 201);
}