import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId") ?? undefined;

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all pending organization invitations for the user's email (always global)
    const orgInvitations = await prisma.organizationInvitation.findMany({
      where: {
        email: session.user.email,
        acceptedAt: null,
        expiresAt: { gte: new Date() },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch pending project invitations - filtered by orgId if provided
    const projectInvitations = await prisma.projectInvitation.findMany({
      where: {
        userId: user.id,
        acceptedAt: null,
        expiresAt: { gte: new Date() },
        ...(orgId && {
          project: {
            organizationId: orgId,
          },
        }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      organizationInvitations: orgInvitations,
      projectInvitations,
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
