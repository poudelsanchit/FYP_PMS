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
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get("search") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const skip = (page - 1) * limit;

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

    // Build where clause with search
    const where = {
      organizationId: orgId,
      ...(search && {
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }),
    };

    // Fetch members with pagination
    const [members, total] = await Promise.all([
      prisma.organizationMember.findMany({
        where,
        skip,
        take: limit,
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
      }),
      prisma.organizationMember.count({ where }),
    ]);

    // Fetch pending invitations (only if no pagination/search)
    const invitations = !search && page === 1
      ? await prisma.organizationInvitation.findMany({
          where: {
            organizationId: orgId,
            acceptedAt: null,
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

    return NextResponse.json({
      members,
      invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
