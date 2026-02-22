/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/labels
 * POST /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/labels
 *
 * POST body: { name: string, color?: string }
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

  const labels = await prisma.label.findMany({
    where: { boardId },
    orderBy: { name: "asc" },
  });

  return ok(labels);
}

export async function POST(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const body = await req.json();
  const { name, color } = body;

  if (!name?.trim()) return err("Label name is required");
  if (color && !/^#[0-9A-Fa-f]{6}$/.test(color))
    return err("Color must be a valid hex code (e.g. #3b82f6)");

  const existing = await prisma.label.findUnique({
    where: { boardId_name: { boardId, name: name.trim() } },
  });
  if (existing)
    return err("A label with this name already exists on this board");

  const label = await prisma.label.create({
    data: { boardId, name: name.trim(), color: color ?? null },
  });

  return ok(label, 201);
}
