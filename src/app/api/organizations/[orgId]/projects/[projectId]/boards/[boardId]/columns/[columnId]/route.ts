/**
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/columns/[columnId]
 * DELETE /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/columns/[columnId]
 *
 * PATCH body: { name?: string, order?: number }
 * Reordering shifts all sibling columns between old and new position to keep orders contiguous.
 * DELETE is blocked if the column contains any issues.
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
    columnId: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, columnId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.projectMember))
    return err("Forbidden: insufficient role", 403);

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
  });
  if (!column) return err("Column not found", 404);

  const body = await req.json();
  const { name, order, isCompleted } = body;

  if (!name?.trim() && order === undefined && isCompleted === undefined)
    return err("Provide at least name, order, or isCompleted");

  // Reorder: shift siblings to make room
  if (order !== undefined && order !== column.order) {
    const movingDown = order > column.order;

    await prisma.$transaction(async (tx) => {
      // If setting as terminal column, unset all other terminal columns
      if (isCompleted === true) {
        await tx.column.updateMany({
          where: { boardId, isCompleted: true, id: { not: columnId } },
          data: { isCompleted: false },
        });
      }

      // Temporarily park the column at -1 to avoid unique constraint collision
      await tx.column.update({ where: { id: columnId }, data: { order: -1 } });
      
      await tx.column.updateMany({
        where: {
          boardId,
          order: movingDown
            ? { gte: column.order + 1, lte: order }
            : { gte: order, lte: column.order - 1 },
        },
        data: { order: { increment: movingDown ? -1 : 1 } },
      });
      
      await tx.column.update({
        where: { id: columnId },
        data: {
          order,
          ...(name?.trim() && { name: name.trim() }),
          ...(isCompleted !== undefined && { isCompleted }),
        },
      });
    });

    const updated = await prisma.column.findUnique({ where: { id: columnId } });
    return ok(updated);
  }

  // Update without reordering
  const updated = await prisma.$transaction(async (tx) => {
    // If setting as terminal column, unset all other terminal columns
    if (isCompleted === true) {
      await tx.column.updateMany({
        where: { boardId, isCompleted: true, id: { not: columnId } },
        data: { isCompleted: false },
      });
    }

    return tx.column.update({
      where: { id: columnId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(isCompleted !== undefined && { isCompleted }),
      },
    });
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, columnId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.projectMember))
    return err("Forbidden: insufficient role", 403);

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
  });
  if (!column) return err("Column not found", 404);

  const issueCount = await prisma.issue.count({ where: { columnId } });
  if (issueCount > 0)
    return err(
      `Cannot delete column with ${issueCount} issue(s). Move or delete them first.`,
    );

  await prisma.column.delete({ where: { id: columnId } });
  return ok({ message: "Column deleted" });
}
