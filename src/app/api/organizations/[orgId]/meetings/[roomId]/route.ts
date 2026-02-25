// src/app/api/organizations/[orgId]/meetings/[roomId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { canManageRooms, isOrgMember } from "@/core/lib/meetings/meetingAuth";
import { prisma } from "@/core/lib/prisma/prisma";

type Params = { params: Promise<{ orgId: string; roomId: string }> };

// GET /api/organizations/[orgId]/meetings/[roomId]
// Any org member can view room details (no password)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { orgId, roomId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await isOrgMember(session.user.id, orgId);
    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const room = await prisma.meetingRoom.findFirst({
      where: { id: roomId, organizationId: orgId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        scheduledAt: true,
        endedAt: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        participants: {
          select: {
            joinedAt: true,
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const hasJoined = await prisma.meetingParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: session.user.id } },
    });

    return NextResponse.json({
      ...room,
      participantCount: room._count.participants,
      hasJoined: !!hasJoined,
    });
  } catch (error) {
    console.error("[GET /meetings/[roomId]]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// PATCH /api/organizations/[orgId]/meetings/[roomId]
// ORG_ADMIN or PROJECT_LEAD can update room name, description, or password
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { orgId, roomId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await canManageRooms(session.user.id, orgId);
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const room = await prisma.meetingRoom.findFirst({
      where: { id: roomId, organizationId: orgId },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, password, scheduledAt } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (scheduledAt !== undefined)
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (password) {
      if (password.length < 4) {
        return NextResponse.json(
          { error: "Password must be at least 4 characters" },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.meetingRoom.update({
      where: { id: roomId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        scheduledAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /meetings/[roomId]]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// DELETE /api/organizations/[orgId]/meetings/[roomId]
// Closes the room (sets isActive: false, endedAt: now) — only ORG_ADMIN or PROJECT_LEAD
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { orgId, roomId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await canManageRooms(session.user.id, orgId);
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const room = await prisma.meetingRoom.findFirst({
      where: { id: roomId, organizationId: orgId },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    await prisma.meetingRoom.update({
      where: { id: roomId },
      data: { isActive: false, endedAt: new Date() },
    });

    return NextResponse.json({ message: "Room closed successfully" });
  } catch (error) {
    console.error("[DELETE /meetings/[roomId]]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
