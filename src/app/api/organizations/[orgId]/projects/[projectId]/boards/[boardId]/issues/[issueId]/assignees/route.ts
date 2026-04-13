/**
 * GET    /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues/[issueId]/assignees
 * POST   /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues/[issueId]/assignees
 * DELETE /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/issues/[issueId]/assignees
 *
 * POST body:   { userId: string }
 * DELETE body: { userId: string }
 *
 * The user being assigned must be a project member.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, ok } from "@/core/lib/api/api";
import { resolveBoardAccess } from "@/core/lib/api/board-access";
import { logIssueActivity } from "@/core/lib/activity/issue-activity";

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

  const issue = await getIssueOnBoard(issueId, boardId);
  if (!issue) return err("Issue not found", 404);

  const assignees = await prisma.issueAssignee.findMany({
    where: { issueId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { assignedAt: "asc" },
  });

  return ok(assignees);
}

export async function POST(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, issueId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const issue = await getIssueOnBoard(issueId, boardId);
  if (!issue) return err("Issue not found", 404);

  const body = await req.json();
  const { userId: assigneeId } = body;
  if (!assigneeId) return err("userId is required");

  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!projectMember) return err("User is not a member of this project");

  const existing = await prisma.issueAssignee.findUnique({
    where: { issueId_userId: { issueId, userId: assigneeId } },
  });
  if (existing) return err("User is already assigned to this issue");

  const assignee = await prisma.$transaction(async (tx) => {
    const created = await tx.issueAssignee.create({
      data: { issueId, userId: assigneeId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Log assignee added activity
    await tx.issueActivity.create({
      data: {
        issueId,
        type: "ASSIGNEE_ADDED",
        newValue: projectMember.user.name || projectMember.user.id,
      },
    });

    return created;
  });

  return ok(assignee, 201);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { orgId, projectId, boardId, issueId } = await params;
  const access = await resolveBoardAccess(req, orgId, projectId, boardId);
  if (!access.ok) return access.response;

  const issue = await getIssueOnBoard(issueId, boardId);
  if (!issue) return err("Issue not found", 404);

  const body = await req.json();
  const { userId: assigneeId } = body;
  if (!assigneeId) return err("userId is required");

  const assignee = await prisma.issueAssignee.findUnique({
    where: { issueId_userId: { issueId, userId: assigneeId } },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!assignee) return err("User is not assigned to this issue");

  await prisma.$transaction(async (tx) => {
    await tx.issueAssignee.delete({
      where: { issueId_userId: { issueId, userId: assigneeId } },
    });

    // Log assignee removed activity
    await tx.issueActivity.create({
      data: {
        issueId,
        type: "ASSIGNEE_REMOVED",
        oldValue: assignee.user.name || assignee.user.id,
      },
    });
  });

  return ok({ message: "Assignee removed" });
}
