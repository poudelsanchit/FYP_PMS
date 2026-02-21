/**
 * GET  /api/organizations/[orgId]/projects  – list projects (with optional filters)
 * POST /api/organizations/[orgId]/projects  – create a project
 *
 * Query params (GET):
 *   includeMembers=true   – include project members in each project
 *   search=<string>       – filter by name/key (case-insensitive)
 *   page=<number>         – pagination page (default 1)
 *   limit=<number>        – items per page (default 20, max 100)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/core/lib/prisma/prisma";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";

interface Context {
  params: Promise<{ orgId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId } = await params;

  // Verify caller is an org member
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!membership) return err("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const includeMembers = searchParams.get("includeMembers") === "true";
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const where = {
    organizationId: orgId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { key: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
        ...(includeMembers && {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
        }),
        _count: { select: { members: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return ok({
    projects,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId } = await params;

  // Caller must be an org member (any role may create a project)
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!membership) return err("Forbidden", 403);

  const body = await req.json();
  const { name, key, description, color } = body;

  if (!name?.trim()) return err("Project name is required");
  if (!key?.trim()) return err("Project key is required");

  const keyRegex = /^[A-Za-z0-9]{2,10}$/;
  if (!keyRegex.test(key)) return err("Key must be 2-10 alphanumeric characters");

  // Key must be unique within the organization
  const existing = await prisma.project.findFirst({
    where: { organizationId: orgId, key: key.toUpperCase() },
  });
  if (existing) return err("A project with this key already exists in the organization");

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        key: key.toUpperCase(),
        description: description?.trim(),
        color: color ?? "#3b82f6",
        createdById: userId,
      },
    });

    // Auto-add creator as PROJECT_LEAD
    await tx.projectMember.create({
      data: { projectId: created.id, userId, role: "PROJECT_LEAD" },
    });

    return created;
  });

  return ok(project, 201);
}