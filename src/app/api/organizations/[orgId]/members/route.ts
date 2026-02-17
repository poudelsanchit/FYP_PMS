import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;

    // Check if user is member of the organization
    const userMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        user: { email: session.user.email },
      },
    });

    if (!userMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all members
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { role: "asc" },
    });

    // Fetch pending invitations
    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: orgId,
        acceptedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ members, invitations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
