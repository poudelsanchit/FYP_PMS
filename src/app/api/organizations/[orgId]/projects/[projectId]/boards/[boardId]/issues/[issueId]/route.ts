/**
 * GET    /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues/[issueId]
 * PATCH  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues/[issueId]
 * DELETE /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues/[issueId]
 *
 * PATCH body (all optional):
 *   title, description, columnId, order, labelId, priorityId
 *
 * Moving to a new column: pass columnId (order defaults to end of target column).
 * Reordering within a column: pass order only.
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
    issueId: string;
  }>;
}

async function getIssueOnBoard(issueId: string, boardId: string) {
  const boardColumns = await prisma.column.findMany({
    where: { boardId },
    select: { id: true },
  });
  return prisma.issue.findFirst({
    where: { id: issueId, columnId: { in: boardColumns.map((c) => c.id) } },
  });
}

export async function GET(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, issueId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const issue = await prisma.issue.findFirst({
    where: { id: issueId, projectId },
    include: {
      label: true,
      priority: true,
      column: { select: { id: true, name: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });

  if (!issue) return err("Issue not found", 404);
  return ok(issue);
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, issueId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (
    access.boardMember?.role === "BOARD_VIEWER" &&
    access.orgMember.role !== "ORG_ADMIN"
  )
    return err("Forbidden: viewers cannot edit issues", 403);

  const issue = await getIssueOnBoard(issueId, boardId);
  if (!issue) return err("Issue not found", 404);

  const body = await req.json();
  const { title, description, columnId, order, labelId, priorityId } = body;

  if (columnId && columnId !== issue.columnId) {
    const col = await prisma.column.findFirst({
      where: { id: columnId, boardId },
    });
    if (!col) return err("Target column not found on this board", 404);
  }
  if (labelId) {
    const label = await prisma.label.findFirst({
      where: { id: labelId, boardId },
    });
    if (!label) return err("Label not found on this board", 404);
  }
  if (priorityId) {
    const priority = await prisma.priority.findFirst({
      where: { id: priorityId, boardId },
    });
    if (!priority) return err("Priority not found on this board", 404);
  }

  // Auto-append to bottom of target column if moving without explicit order
  let resolvedOrder = order;
  const isMovingColumn = columnId && columnId !== issue.columnId;
  if (isMovingColumn && resolvedOrder === undefined) {
    const last = await prisma.issue.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    resolvedOrder = (last?.order ?? -1) + 1;
  }

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: {
      ...(title?.trim() && { title: title.trim() }),
      ...(description !== undefined && {
        description: description?.trim() ?? null,
      }),
      ...(columnId && { columnId }),
      ...(resolvedOrder !== undefined && { order: resolvedOrder }),
      ...(labelId !== undefined && { labelId: labelId ?? null }),
      ...(priorityId !== undefined && { priorityId: priorityId ?? null }),
    },
    include: {
      label: true,
      priority: true,
      column: { select: { id: true, name: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, issueId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  if (!canManageBoard(access.orgMember, access.boardMember))
    return err("Forbidden: insufficient role", 403);

  const issue = await getIssueOnBoard(issueId, boardId);
  if (!issue) return err("Issue not found", 404);

  await prisma.issue.delete({ where: { id: issueId } });
  return ok({ message: "Issue deleted" });
}
