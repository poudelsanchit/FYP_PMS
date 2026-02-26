import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";

const ok = (data: unknown, status = 200) =>
  NextResponse.json({ data }, { status });
const err = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

/**
 * GET /api/organizations/[orgId]/projects/[projectId]/boards/[boardId]/reports
 * Returns board analytics: column distribution, throughput (daily/weekly/monthly), overdue issues
 */
export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{ orgId: string; projectId: string; boardId: string }>;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  const { orgId, projectId, boardId } = await context.params;

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

  // Fetch board with columns
  const board = await prisma.board.findUnique({
    where: { id: boardId, projectId },
    include: {
      columns: { orderBy: { order: "asc" } },
    },
  });
  if (!board) return err("Board not found", 404);

  // Fetch all issues with details
  const issues = await prisma.issue.findMany({
    where: { column: { boardId } },
    include: {
      priority: true,
      label: true,
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
    },
    orderBy: [{ columnId: "asc" }, { order: "asc" }],
  });

  const now = new Date();

  // ─── Column Distribution ───────────────────────────────────────────────────

  const columnData = board.columns.map((col) => {
    const columnIssues = issues.filter((i) => i.columnId === col.id);
    return {
      id: col.id,
      name: col.name,
      order: col.order,
      isCompleted: col.isCompleted,
      issueCount: columnIssues.length,
      issues: columnIssues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        priority: issue.priority
          ? { name: issue.priority.name, color: issue.priority.color }
          : null,
        label: issue.label
          ? { name: issue.label.name, color: issue.label.color }
          : null,
        dueDate: issue.dueDate?.toISOString() ?? null,
        assignees: issue.assignees.map((a) => ({
          id: a.user.id,
          name: a.user.name,
          avatar: a.user.avatar,
        })),
      })),
    };
  });

  // ─── Summary Stats ─────────────────────────────────────────────────────────

  const totalIssues = issues.length;
  const completedColumn = board.columns.find((col) => col.isCompleted);
  const completedIssues = completedColumn
    ? issues.filter((i) => i.columnId === completedColumn.id).length
    : 0;
  const overdueCount = issues.filter(
    (i) => i.dueDate && i.dueDate < now && !i.completedAt
  ).length;
  const completionRate =
    totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  // ─── Overdue Issues ────────────────────────────────────────────────────────

  const overdueIssuesDetailed = issues
    .filter((i) => i.dueDate && i.dueDate < now && !i.completedAt)
    .map((issue) => {
      const daysOverdue = Math.floor(
        (now.getTime() - issue.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
      );
      const col = board.columns.find((c) => c.id === issue.columnId);
      return {
        id: issue.id,
        title: issue.title,
        dueDate: issue.dueDate?.toISOString() ?? null,
        daysOverdue,
        columnId: issue.columnId,
        columnName: col?.name ?? "Unknown",
        priority: issue.priority
          ? { name: issue.priority.name, color: issue.priority.color }
          : null,
        label: issue.label
          ? { name: issue.label.name, color: issue.label.color }
          : null,
        assignees: issue.assignees.map((a) => ({
          id: a.user.id,
          name: a.user.name,
          avatar: a.user.avatar,
        })),
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  // ─── Helper ────────────────────────────────────────────────────────────────

  const average = (arr: number[]) =>
    arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      : 0;

  // ─── Throughput — Daily (last 30 days including today) ────────────────────
  // Start at midnight 29 days ago so we get exactly 30 buckets ending today

  const dailyStart = new Date(now);
  dailyStart.setDate(now.getDate() - 29);
  dailyStart.setHours(0, 0, 0, 0);

  const completedLast30Days = await prisma.issue.findMany({
    where: {
      column: { boardId },
      completedAt: { gte: dailyStart },
    },
    select: { id: true, completedAt: true },
  });

  const dailyThroughput = Array.from({ length: 30 }, (_, i) => {
    // ms arithmetic avoids setDate cross-month bugs
    const dayStart = new Date(dailyStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const count = completedLast30Days.filter(
      (issue) =>
        issue.completedAt &&
        issue.completedAt >= dayStart &&
        issue.completedAt < dayEnd
    ).length;

    return {
      day: dayStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count,
      dayStart: dayStart.toISOString(),
    };
  });

  // ─── Throughput — Weekly (last 12 weeks including current week) ───────────
  // Anchor to the start of the current week (Monday) so "this week" is always the last bar

  const currentWeekStart = new Date(now);
  const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  currentWeekStart.setDate(now.getDate() - daysToMonday);
  currentWeekStart.setHours(0, 0, 0, 0);

  // Go back 11 more weeks from current week start = 12 weeks total
  const weeklyStart = new Date(
    currentWeekStart.getTime() - 11 * 7 * 24 * 60 * 60 * 1000
  );

  const completedLast12Weeks = await prisma.issue.findMany({
    where: {
      column: { boardId },
      completedAt: { gte: weeklyStart },
    },
    select: { id: true, completedAt: true },
  });

  const weeklyThroughput = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(
      weeklyStart.getTime() + i * 7 * 24 * 60 * 60 * 1000
    );
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const count = completedLast12Weeks.filter(
      (issue) =>
        issue.completedAt &&
        issue.completedAt >= weekStart &&
        issue.completedAt < weekEnd
    ).length;

    // Short label like "Feb 3" — the start of that week
    const label = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      week: label,
      count,
      weekStart: weekStart.toISOString(),
    };
  });

  // ─── Throughput — Monthly (last 12 months including current month) ────────
  // Anchor: first day of (currentMonth - 11) → 12 months ending this month

  const monthlyStart = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1,
    0, 0, 0, 0
  );

  const completedLast12Months = await prisma.issue.findMany({
    where: {
      column: { boardId },
      completedAt: { gte: monthlyStart },
    },
    select: { id: true, completedAt: true },
  });

  const monthlyThroughput = Array.from({ length: 12 }, (_, i) => {
    // Date(year, month) constructor handles year rollovers automatically (e.g. Jan → Dec prev year)
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 11 + i,
      1,
      0, 0, 0, 0
    );
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() - 11 + i + 1,
      1,
      0, 0, 0, 0
    );

    const count = completedLast12Months.filter(
      (issue) =>
        issue.completedAt &&
        issue.completedAt >= monthStart &&
        issue.completedAt < monthEnd
    ).length;

    return {
      month: monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      count,
      monthStart: monthStart.toISOString(),
    };
  });

  // ─── Averages & Velocity Trend ────────────────────────────────────────────

  const averageDaily = average(dailyThroughput.map((d) => d.count));
  const averageWeekly = average(weeklyThroughput.map((w) => w.count));
  const averageMonthly = average(monthlyThroughput.map((m) => m.count));

  // Compare first 6 weeks vs last 6 weeks to detect velocity direction
  const firstHalfAvg = average(weeklyThroughput.slice(0, 6).map((w) => w.count));
  const secondHalfAvg = average(weeklyThroughput.slice(6).map((w) => w.count));
  let velocityTrend: "improving" | "declining" | "stable" = "stable";
  if (secondHalfAvg > firstHalfAvg * 1.1) velocityTrend = "improving";
  else if (secondHalfAvg < firstHalfAvg * 0.9) velocityTrend = "declining";

  // ─── Assignee Workload ─────────────────────────────────────────────────────

  // Get all unique assignees from issues
  const assigneeMap = new Map<string, {
    id: string
    name: string | null
    avatar: string | null
    email: string | null
    totalIssues: number
    completedIssues: number
    inProgressIssues: number
    todoIssues: number
  }>();

  // Count unassigned issues
  let unassignedCount = 0;

  issues.forEach((issue) => {
    if (!issue.assignees || issue.assignees.length === 0) {
      unassignedCount++;
    } else {
      issue.assignees.forEach((assignee) => {
        const userId = assignee.user.id;
        if (!assigneeMap.has(userId)) {
          assigneeMap.set(userId, {
            id: userId,
            name: assignee.user.name,
            avatar: assignee.user.avatar,
            email: assignee.user.email,
            totalIssues: 0,
            completedIssues: 0,
            inProgressIssues: 0,
            todoIssues: 0,
          });
        }

        const assigneeData = assigneeMap.get(userId)!;
        assigneeData.totalIssues++;

        // Categorize by column type
        const column = board.columns.find((col) => col.id === issue.columnId);
        if (column?.isCompleted) {
          assigneeData.completedIssues++;
        } else if (column?.name.toLowerCase().includes('progress')) {
          assigneeData.inProgressIssues++;
        } else {
          assigneeData.todoIssues++;
        }
      });
    }
  });

  const assigneeWorkload = Array.from(assigneeMap.values()).sort(
    (a, b) => b.totalIssues - a.totalIssues
  );

  // ─── Response ──────────────────────────────────────────────────────────────

  
  return ok({
    boardName: board.name,
    generatedAt: now.toISOString(),
    columns: columnData,
    summary: {
      totalIssues,
      completedIssues,
      overdueIssues: overdueCount,
      completionRate,
    },
    overdue: {
      total: overdueCount,
      issues: overdueIssuesDetailed,
    },
    throughput: {
      daily: dailyThroughput,     // 30 entries — last 30 days including today
      weekly: weeklyThroughput,   // 12 entries — last 12 weeks, last = current week
      monthly: monthlyThroughput, // 12 entries — last 12 months including this month
      averageDaily,
      averageWeekly,
      averageMonthly,
      velocityTrend,              // "improving" | "declining" | "stable"
    },
    assigneeWorkload: {
      assignees: assigneeWorkload,
      unassignedCount,
    },
  });
}