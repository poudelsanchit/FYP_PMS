import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = await params;
    const body = await req.json();
    const { action, type } = body; // action: "accept" or "reject", type: "organization" or "project"

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (type === "project") {
      // Handle project invitation
      const invitation = await prisma.projectInvitation.findUnique({
        where: { id: invitationId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "Invitation not found" },
          { status: 404 }
        );
      }

      // Verify the invitation is for this user
      if (invitation.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if invitation is still valid
      if (invitation.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Invitation has expired" },
          { status: 400 }
        );
      }

      if (invitation.acceptedAt) {
        return NextResponse.json(
          { error: "Invitation already accepted" },
          { status: 400 }
        );
      }

      if (action === "accept") {
        // Check if user is already a project member
        const existingMember = await prisma.projectMember.findFirst({
          where: {
            userId: user.id,
            projectId: invitation.projectId!,
          },
        });

        if (existingMember) {
          return NextResponse.json(
            { error: "Already a member of this project" },
            { status: 400 }
          );
        }

        // Create project member and mark invitation as accepted
        await prisma.$transaction([
          prisma.projectMember.create({
            data: {
              userId: user.id,
              projectId: invitation.projectId!,
              role: invitation.role,
            },
          }),
          prisma.projectInvitation.update({
            where: { id: invitationId },
            data: { acceptedAt: new Date() },
          }),
        ]);

        return NextResponse.json(
          {
            message: "Project invitation accepted successfully",
            project: invitation.project,
          },
          { status: 200 }
        );
      } else if (action === "reject") {
        // Delete the invitation
        await prisma.projectInvitation.delete({
          where: { id: invitationId },
        });

        return NextResponse.json(
          { message: "Project invitation rejected" },
          { status: 200 }
        );
      }
    } else {
      // Handle organization invitation (existing logic)
      const invitation = await prisma.organizationInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: "Invitation not found" },
          { status: 404 }
        );
      }

      // Verify the invitation is for this user
      if (invitation.email !== session.user.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Check if invitation is still valid
      if (invitation.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Invitation has expired" },
          { status: 400 }
        );
      }

      if (invitation.acceptedAt) {
        return NextResponse.json(
          { error: "Invitation already accepted" },
          { status: 400 }
        );
      }

      if (action === "accept") {
        // Check if user is already a member
        const existingMember = await prisma.organizationMember.findFirst({
          where: {
            userId: user.id,
            organizationId: invitation.organizationId,
          },
        });

        if (existingMember) {
          return NextResponse.json(
            { error: "Already a member of this organization" },
            { status: 400 }
          );
        }

        // Create organization member and mark invitation as accepted
        await prisma.$transaction([
          prisma.organizationMember.create({
            data: {
              userId: user.id,
              organizationId: invitation.organizationId,
              role: invitation.role,
            },
          }),
          prisma.organizationInvitation.update({
            where: { id: invitationId },
            data: { acceptedAt: new Date() },
          }),
        ]);

        return NextResponse.json(
          { message: "Invitation accepted successfully" },
          { status: 200 }
        );
      } else if (action === "reject") {
        // Delete the invitation
        await prisma.organizationInvitation.delete({
          where: { id: invitationId },
        });

        return NextResponse.json(
          { message: "Invitation rejected" },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
