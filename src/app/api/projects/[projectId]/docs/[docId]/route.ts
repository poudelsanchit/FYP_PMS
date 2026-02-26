/**
 * GET    /api/projects/[projectId]/docs/[docId]  – get a single doc
 * PATCH  /api/projects/[projectId]/docs/[docId]  – update a doc
 * DELETE /api/projects/[projectId]/docs/[docId]  – delete a doc
 */

import { NextRequest } from "next/server";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";
import { getDocPermissions } from "@/core/lib/docs/docAuth";
import { TiptapDocument } from "@/features/docs/types/doc.types";

interface Context {
  params: Promise<{ projectId: string; docId: string }>;
}

/**
 * Verifies that the user is a member of the project.
 * Returns the project member record with role if authorized, null otherwise.
 */
async function verifyProjectMembership(userId: string, projectId: string) {
  const projectMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return projectMember;
}

/**
 * GET /api/projects/[projectId]/docs/[docId]
 * Returns a single doc with author information and permissions.
 * Requires: Project membership
 */
export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { projectId, docId } = await params;

  // Verify project membership
  const projectMember = await verifyProjectMembership(userId, projectId);
  if (!projectMember) return err("Forbidden", 403);

  // Fetch doc with author information
  const doc = await prisma.doc.findUnique({
    where: { id: docId },
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

  if (!doc) return err("Document not found", 404);

  // Verify doc belongs to the project
  if (doc.projectId !== projectId) return err("Document not found", 404);

  // Get user's organization role
  const orgMember = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: (await prisma.project.findUnique({
          where: { id: projectId },
          select: { organizationId: true },
        }))!.organizationId,
      },
    },
  });

  // Calculate permissions
  const docForAuth = {
    id: doc.id,
    projectId: doc.projectId,
    emoji: doc.emoji,
    title: doc.title,
    content: doc.content,
    status: doc.status.toLowerCase() as "draft" | "published",
    authorId: doc.authorId,
    authorName: doc.author.name ?? "Unknown",
    authorAvatar: doc.author.avatar,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  const permissions = getDocPermissions(
    userId,
    docForAuth,
    projectMember.role,
    orgMember?.role ?? null
  );

  // Transform to match API response format
  const response = {
    doc: {
      id: doc.id,
      projectId: doc.projectId,
      emoji: doc.emoji,
      title: doc.title,
      content: doc.content,
      status: doc.status.toLowerCase() as "draft" | "published",
      authorId: doc.authorId,
      authorName: doc.author.name ?? "Unknown",
      authorAvatar: doc.author.avatar,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
    permissions,
  };

  return ok(response);
}

/**
 * PATCH /api/projects/[projectId]/docs/[docId]
 * Updates a document with partial updates.
 * Requires: Project membership
 * For status changes: Requires publish permissions
 */
export async function PATCH(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { projectId, docId } = await params;

  // Verify project membership
  const projectMember = await verifyProjectMembership(userId, projectId);
  if (!projectMember) return err("Forbidden", 403);

  // Fetch existing doc
  const doc = await prisma.doc.findUnique({
    where: { id: docId },
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

  if (!doc) return err("Document not found", 404);

  // Verify doc belongs to the project
  if (doc.projectId !== projectId) return err("Document not found", 404);

  // Parse request body
  const body = await req.json();
  const { emoji, title, content, status } = body;

  // Validate Tiptap JSON format if content is provided
  if (content !== undefined) {
    try {
      const parsed = JSON.parse(content) as TiptapDocument;
      if (parsed.type !== "doc" || !Array.isArray(parsed.content)) {
        return err("Invalid Tiptap JSON format", 422);
      }
    } catch (e) {
      return err("Invalid Tiptap JSON format", 422);
    }
  }

  // If status is being changed, verify user has publish permissions
  if (status !== undefined && status !== doc.status.toLowerCase()) {
    // Get user's organization role
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: (await prisma.project.findUnique({
            where: { id: projectId },
            select: { organizationId: true },
          }))!.organizationId,
        },
      },
    });

    const docForAuth = {
      id: doc.id,
      projectId: doc.projectId,
      emoji: doc.emoji,
      title: doc.title,
      content: doc.content,
      status: doc.status.toLowerCase() as "draft" | "published",
      authorId: doc.authorId,
      authorName: doc.author.name ?? "Unknown",
      authorAvatar: doc.author.avatar,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    const permissions = getDocPermissions(
      userId,
      docForAuth,
      projectMember.role,
      orgMember?.role ?? null
    );

    if (!permissions.canPublish) {
      return err("Forbidden: You don't have permission to change document status", 403);
    }
  }

  // Build update data
  const updateData: any = {};
  if (emoji !== undefined) updateData.emoji = emoji;
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (status !== undefined) {
    updateData.status = status === "published" ? "PUBLISHED" : "DRAFT";
  }

  // Update doc
  const updatedDoc = await prisma.doc.update({
    where: { id: docId },
    data: updateData,
  });

  return ok({
    doc: {
      id: updatedDoc.id,
      updatedAt: updatedDoc.updatedAt.toISOString(),
    },
  });
}

/**
 * DELETE /api/projects/[projectId]/docs/[docId]
 * Deletes a document.
 * Requires: Delete permissions (author, PROJECT_LEAD, or ORG_ADMIN)
 */
export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { projectId, docId } = await params;

  // Verify project membership
  const projectMember = await verifyProjectMembership(userId, projectId);
  if (!projectMember) return err("Forbidden", 403);

  // Fetch existing doc
  const doc = await prisma.doc.findUnique({
    where: { id: docId },
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

  if (!doc) return err("Document not found", 404);

  // Verify doc belongs to the project
  if (doc.projectId !== projectId) return err("Document not found", 404);

  // Get user's organization role
  const orgMember = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: (await prisma.project.findUnique({
          where: { id: projectId },
          select: { organizationId: true },
        }))!.organizationId,
      },
    },
  });

  // Check delete permissions
  const docForAuth = {
    id: doc.id,
    projectId: doc.projectId,
    emoji: doc.emoji,
    title: doc.title,
    content: doc.content,
    status: doc.status.toLowerCase() as "draft" | "published",
    authorId: doc.authorId,
    authorName: doc.author.name ?? "Unknown",
    authorAvatar: doc.author.avatar,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  const permissions = getDocPermissions(
    userId,
    docForAuth,
    projectMember.role,
    orgMember?.role ?? null
  );

  if (!permissions.canDelete) {
    return err("Forbidden: You don't have permission to delete this document", 403);
  }

  // Delete doc
  await prisma.doc.delete({
    where: { id: docId },
  });

  return ok({ success: true });
}
