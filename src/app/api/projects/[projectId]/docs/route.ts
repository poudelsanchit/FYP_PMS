/**
 * GET  /api/projects/[projectId]/docs  – list all docs for a project
 * POST /api/projects/[projectId]/docs  – create a new doc
 *
 * Query params (GET):
 *   status=draft|published  – filter by status
 *   search=text            – filter by title (case-insensitive)
 */

import { NextRequest } from "next/server";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";
import { checkDocsLimit } from "@/core/lib/billing/limits";

interface Context {
  params: Promise<{ projectId: string }>;
}

/**
 * Verifies that the user is a member of the project.
 * Returns the project member record if authorized, null otherwise.
 */
async function verifyProjectMembership(userId: string, projectId: string) {
  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return projectMember;
}

/**
 * GET /api/projects/[projectId]/docs
 * Returns all docs for a project with optional filtering.
 * Requires: Project membership
 */
export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { projectId } = await params;

  // Verify project membership
  const projectMember = await verifyProjectMembership(userId, projectId);
  if (!projectMember) return err("Forbidden", 403);

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) return err("Project not found", 404);

  // Parse query parameters
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const searchQuery = searchParams.get("search");

  // Build where clause
  const where: any = { projectId };

  if (statusFilter === "draft") {
    where.status = "DRAFT";
  } else if (statusFilter === "published") {
    where.status = "PUBLISHED";
  }

  if (searchQuery) {
    where.title = {
      contains: searchQuery,
      mode: "insensitive",
    };
  }

  // Fetch docs with author information
  const docs = await prisma.doc.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Transform to match API response format
  const response = docs.map((doc) => ({
    id: doc.id,
    projectId: doc.projectId,
    emoji: doc.emoji,
    title: doc.title,
    status: doc.status.toLowerCase() as "draft" | "published",
    authorId: doc.authorId,
    authorName: doc.author.name ?? "Unknown",
    authorAvatar: doc.author.avatar,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));

  return ok({ docs: response });
}

/**
 * POST /api/projects/[projectId]/docs
 * Creates a new doc with default values.
 * Requires: Project membership
 */
export async function POST(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { projectId } = await params;

  // Verify project membership
  const projectMember = await verifyProjectMembership(userId, projectId);
  if (!projectMember) return err("Forbidden", 403);

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) return err("Project not found", 404);

  // Check docs limit
  const limitCheck = await checkDocsLimit(project.organizationId);
  if (!limitCheck.allowed) {
    return err(limitCheck.message || "Docs limit reached", 403);
  }

  // Create new doc with defaults
  const doc = await prisma.doc.create({
    data: {
      projectId,
      authorId: userId,
      emoji: "📝",
      title: "",
      content: '{"type":"doc","content":[]}',
      status: "DRAFT",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return ok(
    {
      doc: {
        id: doc.id,
        projectId: doc.projectId,
        emoji: doc.emoji,
        title: doc.title,
        content: doc.content,
        status: doc.status.toLowerCase() as "draft",
        authorId: doc.authorId,
        authorName: doc.author.name ?? "Unknown",
        authorAvatar: doc.author.avatar,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    },
    201
  );
}
