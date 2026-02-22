/**
 * GET  /api/organizations/[orgId]/projects/[projectId]/boards
 * POST /api/organizations/[orgId]/projects/[projectId]/boards
 *
 * POST body: { name: string, type?: "KANBAN" }
 *
 * Creating a board automatically seeds 5 default columns and adds
 * the creator as BOARD_LEAD.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";

interface Context {
  params: Promise<{ orgId: string; projectId: string }>;
}

const DEFAULT_COLUMNS = ["Backlog", "Todo", "In Progress", "In Review", "Done"];

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;

  const orgMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!orgMember) return err("Forbidden", 403);

  const boards = await prisma.board.findMany({
    where: { projectId, organizationId: orgId },
    include: {
      _count: { select: { columns: true, members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return ok(boards);
}

export async function POST(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, projectId } = await params;

  const [orgMember, projectMember] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);

  if (!orgMember) return err("Forbidden", 403);

  const canCreate =
    orgMember.role === "ORG_ADMIN" || projectMember?.role === "PROJECT_LEAD";
  if (!canCreate)
    return err(
      "Forbidden: only project leads or org admins can create boards",
      403,
    );

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true },
  });
  if (!project) return err("Project not found", 404);

  const body = await req.json();
  const { name, type = "KANBAN" } = body;

  if (!name?.trim()) return err("Board name is required");
  if (type !== "KANBAN") return err("Unsupported board type");

  const board = await prisma.$transaction(async (tx) => {
    const created = await tx.board.create({
      data: { projectId, organizationId: orgId, name: name.trim(), type },
    });

    await tx.column.createMany({
      data: DEFAULT_COLUMNS.map((colName, index) => ({
        boardId: created.id,
        name: colName,
        order: index,
      })),
    });

    await tx.boardMember.create({
      data: { boardId: created.id, userId, role: "BOARD_LEAD" },
    });

    return tx.board.findUnique({
      where: { id: created.id },
      include: { columns: { orderBy: { order: "asc" } } },
    });
  });

  return ok(board, 201);
}
