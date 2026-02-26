import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";

const ok = (data: unknown, status = 200) =>
  NextResponse.json({ data }, { status });
const err = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

/**
 * GET /api/organizations/[orgId]/projects/[projectId]/reports
 * Returns project-level analytics across all boards
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orgId: string; projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  const { orgId, projectId } = await context.params;

  // Check org membership
  const orgMember = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });
  if (!orgMember) return err("Forbidden", 403);

  // Check project membership
  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  });
  if (!projectMember) return err("You are not a project member", 403);

  // Fetch project with boards
  const project = await prisma.project.findUnique({
    where: { id: projectId, organizationId: orgId },
    include: {
      boards: {
        include: {
          columns: true,
        },
      },
      projectLabels: true,
      projectPriorities: true,
    },
  });

  if (!project) return err("Project not found", 404);

  // Get all board IDs
  const boardIds = project.boards.map((b: any) => b.id);

  // Fetch all issues across all boards
  const issues = await prisma.issue.findMany({
    where: {
      column: {
        boardId: { in: boardIds },
      },
    },
    include: {
      label: true,
      priority: true,
      column: {
        include: {
          board: {
            select: { id: true, name: true },
          },
        },
      },
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
  });

  const now = new Date();

  // ─── Issue Volume by Label ─────────────────────────────────────────────────

  const labelVolume = project.projectLabels.map((label: any) => {
    const labelIssues = issues.filter((issue) => issue.labelId === label.id);
    const openIssues = labelIssues.filter(
      (issue) => !issue.column.isCompleted
    );
    const completedIssues = labelIssues.filter(
      (issue) => issue.column.isCompleted
    );
    const inProgressIssues = labelIssues.filter(
      (issue) =>
        !issue.column.isCompleted &&
        issue.column.name.toLowerCase().includes("progress")
    );

    return {
      id: label.id,
      name: label.name,
      color: label.color,
      total: labelIssues.length,
      open: openIssues.length,
      inProgress: inProgressIssues.length,
      completed: completedIssues.length,
    };
  });

  // Count unlabeled issues
  const unlabeledIssues = issues.filter((issue) => !issue.labelId);
  if (unlabeledIssues.length > 0) {
    labelVolume.push({
      id: "unlabeled",
      name: "No Label",
      color: "#94a3b8",
      total: unlabeledIssues.length,
      open: unlabeledIssues.filter((issue) => !issue.column.isCompleted).length,
      inProgress: unlabeledIssues.filter(
        (issue) =>
          !issue.column.isCompleted &&
          issue.column.name.toLowerCase().includes("progress")
      ).length,
      completed: unlabeledIssues.filter((issue) => issue.column.isCompleted)
        .length,
    });
  }

  // ─── Issue Volume by Priority ──────────────────────────────────────────────

  const priorityVolume = project.projectPriorities.map((priority: any) => {
    const priorityIssues = issues.filter(
      (issue) => issue.priorityId === priority.id
    );
    const openIssues = priorityIssues.filter(
      (issue) => !issue.column.isCompleted
    );
    const completedIssues = priorityIssues.filter(
      (issue) => issue.column.isCompleted
    );
    const inProgressIssues = priorityIssues.filter(
      (issue) =>
        !issue.column.isCompleted &&
        issue.column.name.toLowerCase().includes("progress")
    );

    return {
      id: priority.id,
      name: priority.name,
      color: priority.color,
      total: priorityIssues.length,
      open: openIssues.length,
      inProgress: inProgressIssues.length,
      completed: completedIssues.length,
    };
  });

  // Count issues without priority
  const noPriorityIssues = issues.filter((issue) => !issue.priorityId);
  if (noPriorityIssues.length > 0) {
    priorityVolume.push({
      id: "no-priority",
      name: "No Priority",
      color: "#94a3b8",
      total: noPriorityIssues.length,
      open: noPriorityIssues.filter((issue) => !issue.column.isCompleted)
        .length,
      inProgress: noPriorityIssues.filter(
        (issue) =>
          !issue.column.isCompleted &&
          issue.column.name.toLowerCase().includes("progress")
      ).length,
      completed: noPriorityIssues.filter((issue) => issue.column.isCompleted)
        .length,
    });
  }

  // ─── Assignee Workload ─────────────────────────────────────────────────────

  const assigneeMap = new Map<
    string,
    {
      id: string;
      name: string | null;
      avatar: string | null;
      email: string | null;
      totalIssues: number;
      openIssues: number;
      completedIssues: number;
      inProgressIssues: number;
    }
  >();

  issues.forEach((issue) => {
    issue.assignees.forEach((assignee) => {
      const userId = assignee.user.id;
      if (!assigneeMap.has(userId)) {
        assigneeMap.set(userId, {
          id: userId,
          name: assignee.user.name,
          avatar: assignee.user.avatar,
          email: assignee.user.email,
          totalIssues: 0,
          openIssues: 0,
          completedIssues: 0,
          inProgressIssues: 0,
        });
      }

      const assigneeData = assigneeMap.get(userId)!;
      assigneeData.totalIssues++;

      if (issue.column.isCompleted) {
        assigneeData.completedIssues++;
      } else if (issue.column.name.toLowerCase().includes("progress")) {
        assigneeData.inProgressIssues++;
      } else {
        assigneeData.openIssues++;
      }
    });
  });

  const assigneeWorkload = Array.from(assigneeMap.values()).sort(
    (a, b) => b.openIssues - a.openIssues
  );

  // ─── Assignee Completion Rate ──────────────────────────────────────────────

  const assigneeCompletionRate = Array.from(assigneeMap.values())
    .map((assignee) => ({
      id: assignee.id,
      name: assignee.name,
      avatar: assignee.avatar,
      totalIssues: assignee.totalIssues,
      completedIssues: assignee.completedIssues,
      completionRate:
        assignee.totalIssues > 0
          ? Math.round((assignee.completedIssues / assignee.totalIssues) * 100)
          : 0,
    }))
    .sort((a, b) => b.completionRate - a.completionRate);

  // ─── Due Date Health ───────────────────────────────────────────────────────

  const totalIssues = issues.length;
  const issuesWithDueDate = issues.filter((issue) => issue.dueDate);
  const issuesWithoutDueDate = issues.filter((issue) => !issue.dueDate);

  const overdueIssues = issuesWithDueDate.filter(
    (issue) => issue.dueDate! < now && !issue.column.isCompleted
  );

  const onTrackIssues = issuesWithDueDate.filter(
    (issue) => issue.dueDate! >= now && !issue.column.isCompleted
  );

  const completedIssues = issues.filter((issue) => issue.column.isCompleted);

  const dueDateHealth = {
    total: totalIssues,
    withDueDate: issuesWithDueDate.length,
    withoutDueDate: issuesWithoutDueDate.length,
    overdue: overdueIssues.length,
    onTrack: onTrackIssues.length,
    completed: completedIssues.length,
    percentWithDueDate:
      totalIssues > 0
        ? Math.round((issuesWithDueDate.length / totalIssues) * 100)
        : 0,
    percentOverdue:
      issuesWithDueDate.length > 0
        ? Math.round((overdueIssues.length / issuesWithDueDate.length) * 100)
        : 0,
    percentOnTrack:
      issuesWithDueDate.length > 0
        ? Math.round((onTrackIssues.length / issuesWithDueDate.length) * 100)
        : 0,
  };

  // ─── Summary Stats ─────────────────────────────────────────────────────────

  const summary = {
    totalIssues,
    totalBoards: project.boards.length,
    totalLabels: project.projectLabels.length,
    totalPriorities: project.projectPriorities.length,
    completedIssues: completedIssues.length,
    openIssues: totalIssues - completedIssues.length,
    completionRate:
      totalIssues > 0
        ? Math.round((completedIssues.length / totalIssues) * 100)
        : 0,
  };

  return ok({
    projectName: project.name,
    generatedAt: now.toISOString(),
    summary,
    labelVolume: labelVolume.sort((a: any, b: any) => b.total - a.total),
    priorityVolume: priorityVolume.sort((a: any, b: any) => b.total - a.total),
    assigneeWorkload,
    assigneeCompletionRate,
    dueDateHealth,
  });
}
