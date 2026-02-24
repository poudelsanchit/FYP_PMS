import { NextRequest } from "next/server";
import { err, getAuthUserId } from "./api";
import { prisma } from "../prisma/prisma";

type ErrResponse = ReturnType<typeof err>;

export type BoardAccessResult =
  | {
      ok: true;
      userId: string;
      orgMember: { role: string };
      projectMember: { role: string };
    }
  | { ok: false; response: ErrResponse };

/**
 * Validates auth + org membership + project membership + board existence in one parallel query.
 * Every board route calls this instead of repeating the same checks.
 */
export async function resolveBoardAccess(
  req: NextRequest,
  orgId: string,
  projectId: string,
  boardId: string
): Promise<BoardAccessResult> {
  const userId = await getAuthUserId(req);
  if (!userId) return { ok: false, response: err("Unauthorized", 401) };

  const [orgMember, board, projectMember] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    }),
    prisma.board.findFirst({
      where: { id: boardId, projectId, organizationId: orgId },
      select: { id: true },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    }),
  ]);

  if (!orgMember) return { ok: false, response: err("Forbidden", 403) };
  if (!board) return { ok: false, response: err("Board not found", 404) };
  if (!projectMember) return { ok: false, response: err("Forbidden: not a project member", 403) };

  return { ok: true, userId, orgMember, projectMember };
}

/** PROJECT_LEAD or ORG_ADMIN can manage the board */
export function canManageBoard(
  orgMember: { role: string },
  projectMember: { role: string }
): boolean {
  return orgMember.role === "ORG_ADMIN" || projectMember.role === "PROJECT_LEAD";
}