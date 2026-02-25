import { prisma } from "@/core/lib/prisma/prisma";

// Returns true if user is ORG_ADMIN OR is a PROJECT_LEAD in any project in this org
export async function canManageRooms(
  userId: string,
  orgId: string,
): Promise<boolean> {
  // Check if ORG_ADMIN
  const orgMember = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });

  if (!orgMember) return false; // not even in this org
  if (orgMember.role === "ORG_ADMIN") return true;

  // Check if PROJECT_LEAD in any project within this org
  const projectLead = await prisma.projectMember.findFirst({
    where: {
      userId,
      role: "PROJECT_LEAD",
      project: { organizationId: orgId },
    },
  });

  return !!projectLead;
}

// Returns true if user is a member of the org (any role)
export async function isOrgMember(
  userId: string,
  orgId: string,
): Promise<boolean> {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  return !!member;
}
