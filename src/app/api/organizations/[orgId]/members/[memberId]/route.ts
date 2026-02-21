/**
 * PATCH  /api/organizations/[orgId]/members/[memberId]  – update organization member role
 * DELETE /api/organizations/[orgId]/members/[memberId]  – remove organization member
 */

import { NextRequest } from "next/server";
import { err, getAuthUserId, ok } from "@/core/lib/api/api";
import { prisma } from "@/core/lib/prisma/prisma";
import { OrganizationRole } from "@/generated/prisma/enums";

interface Context {
  params: Promise<{ orgId: string; memberId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, memberId } = await params;

  const callerMembership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  if (!callerMembership) return err("Forbidden", 403);

  // Only ORG_ADMIN can update member roles
  if (callerMembership.role !== "ORG_ADMIN") {
    return err("Forbidden: only organization admins can update member roles", 403);
  }

  const target = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: orgId },
  });
  if (!target) return err("Member not found", 404);

  const body = await req.json();
  const { role } = body;

  const validRoles: OrganizationRole[] = ["ORG_ADMIN", "ORG_MEMBER"];
  if (!validRoles.includes(role)) return err("Invalid role");

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const userId = await getAuthUserId(req);
  if (!userId) return err("Unauthorized", 401);

  const { orgId, memberId } = await params;

  const callerMembership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  if (!callerMembership) return err("Forbidden", 403);

  const target = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: orgId },
  });
  if (!target) return err("Member not found", 404);

  // Allow self-removal OR ORG_ADMIN to remove others
  const isSelf = target.userId === userId;
  const isAdmin = callerMembership.role === "ORG_ADMIN";

  if (!isSelf && !isAdmin) {
    return err("Forbidden: only admins can remove other members", 403);
  }

  // Prevent removing the last admin
  if (target.role === "ORG_ADMIN") {
    const adminCount = await prisma.organizationMember.count({
      where: { organizationId: orgId, role: "ORG_ADMIN" },
    });
    if (adminCount <= 1) {
      return err("Cannot remove the last organization admin");
    }
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });

  return ok({ message: "Member removed" });
}
