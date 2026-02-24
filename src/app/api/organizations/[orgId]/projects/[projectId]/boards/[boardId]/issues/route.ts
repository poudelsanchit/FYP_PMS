/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues
 * POST /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues
 *
 * GET query params:
 *   columnId=<id>          – filter by column
 *   labelId=<id>           – filter by label
 *   priorityId=<id>        – filter by priority
 *   assigneeId=<id>        – filter by assignee
 *   includeAssignees=true  – include assignee user objects
 *
 * POST body: { title, columnId, description?, labelId?, priorityId?, dueDate?, assigneeIds?: string[] }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, ok } from "@/core/lib/api/api";
import { resolveBoardAccess } from "@/core/lib/api/board-access";

interface Context {
  params: Promise<{ orgId: string; projectId: string; boardId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const columnId = searchParams.get("columnId") ?? undefined;
  const labelId = searchParams.get("labelId") ?? undefined;
  const priorityId = searchParams.get("priorityId") ?? undefined;
  const assigneeId = searchParams.get("assigneeId") ?? undefined;
  const includeAssignees = searchParams.get("includeAssignees") === "true";

  // Scope to columns belonging to this board
  const boardColumns = await prisma.column.findMany({
    where: { boardId },
    select: { id: true },
  });
  const boardColumnIds = boardColumns.map((c) => c.id);

  const issues = await prisma.issue.findMany({
    where: {
      projectId,
      columnId: columnId ? columnId : { in: boardColumnIds },
      ...(labelId && { labelId }),
      ...(priorityId && { priorityId }),
      ...(assigneeId && { assignees: { some: { userId: assigneeId } } }),
    },
    include: {
      label: true,
      priority: true,
      ...(includeAssignees && {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      }),
      _count: { select: { assignees: true } },
    },
    orderBy: [{ columnId: "asc" }, { order: "asc" }],
  });

  return ok(issues);
}

export async function POST(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const body = await req.json();
  const { title, columnId, description, labelId, priorityId, dueDate, assigneeIds } =
    body;

  if (!title?.trim()) return err("Issue title is required");
  if (!columnId) return err("columnId is required");

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
  });
  if (!column) return err("Column not found on this board", 404);

  if (labelId) {
    const label = await prisma.projectLabel.findFirst({
      where: { id: labelId, projectId },
    });
    if (!label) return err("Label not found in this project", 404);
  }
  if (priorityId) {
    const priority = await prisma.projectPriority.findFirst({
      where: { id: priorityId, projectId },
    });
    if (!priority) return err("Priority not found in this project", 404);
  }

  const lastIssue = await prisma.issue.findFirst({
    where: { columnId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (lastIssue?.order ?? -1) + 1;

  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.issue.create({
      data: {
        projectId,
        columnId,
        title: title.trim(),
        description: description?.trim() ?? null,
        order,
        labelId: labelId ?? null,
        priorityId: priorityId ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    if (assigneeIds?.length) {
      await tx.issueAssignee.createMany({
        data: (assigneeIds as string[]).map((uid) => ({
          issueId: created.id,
          userId: uid,
        })),
        skipDuplicates: true,
      });
    }

    return tx.issue.findUnique({
      where: { id: created.id },
      include: {
        label: true,
        priority: true,
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  });

  return ok(issue, 201);
}
