import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";
import { OrganizationRole } from "@/generated/prisma/enums";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;
    const body = await req.json();
    const { emails, role = "ORG_MEMBER" } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Emails array is required" },
        { status: 400 }
      );
    }

    // Check if user is admin of the organization
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        user: { email: session.user.email },
        role: OrganizationRole.ORG_ADMIN,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Only organization admins can invite members" },
        { status: 403 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { email: string; reason: string }[],
      alreadyMember: [] as string[],
      alreadyInvited: [] as string[],
    };

    // Process each email
    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();

      // Basic email validation
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        results.failed.push({
          email: trimmedEmail || email,
          reason: "Invalid email format",
        });
        continue;
      }

      // Check if user is already a member
      const existingMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId: orgId,
          user: { email: trimmedEmail },
        },
      });

      if (existingMember) {
        results.alreadyMember.push(trimmedEmail);
        continue;
      }

      // Check if invitation already exists
      const existingInvitation =
        await prisma.organizationInvitation.findUnique({
          where: {
            email_organizationId: {
              email: trimmedEmail,
              organizationId: orgId,
            },
          },
        });

      if (existingInvitation && !existingInvitation.acceptedAt) {
        results.alreadyInvited.push(trimmedEmail);
        continue;
      }

      // Create invitation
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await prisma.organizationInvitation.upsert({
          where: {
            email_organizationId: {
              email: trimmedEmail,
              organizationId: orgId,
            },
          },
          update: {
            role: role as OrganizationRole,
            expiresAt,
            acceptedAt: null,
            updatedAt: new Date(),
          },
          create: {
            email: trimmedEmail,
            organizationId: orgId,
            role: role as OrganizationRole,
            expiresAt,
          },
        });

        results.success.push(trimmedEmail);
      } catch (error) {
        results.failed.push({
          email: trimmedEmail,
          reason: "Failed to create invitation",
        });
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        user: { email: session.user.email },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        organizationId: orgId,
        acceptedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations, { status: 200 });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
