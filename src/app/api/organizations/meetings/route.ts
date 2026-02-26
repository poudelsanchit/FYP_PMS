// src/app/api/organizations/[orgId]/meetings/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth"; // swap with your own auth helper
import { authOptions } from "@/core/lib/auth/authOptions";
import { canManageRooms, isOrgMember } from "@/core/lib/meetings/meetingAuth";
import { prisma } from "@/core/lib/prisma/prisma";

type Params = { params: Promise<{ orgId: string }> };

// GET /api/organizations/[orgId]/meetings
// Any org member can see all rooms (but NOT the password)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await isOrgMember(session.user.id, orgId);
    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 },
      );
    }

    const rooms = await prisma.meetingRoom.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        scheduledAt: true,
        endedAt: true,
        createdAt: true,
        // never return password
        createdBy: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also tell the frontend whether the current user has already joined each room
    const userParticipations = await prisma.meetingParticipant.findMany({
      where: {
        userId: session.user.id,
        roomId: { in: rooms.map((r) => r.id) },
      },
      select: { roomId: true },
    });

    const joinedRoomIds = new Set(userParticipations.map((p) => p.roomId));

    const data = rooms.map((room) => ({
      ...room,
      participantCount: room._count.participants,
      hasJoined: joinedRoomIds.has(room.id),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /meetings]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// POST /api/organizations/[orgId]/meetings
// Only ORG_ADMIN or PROJECT_LEAD can create rooms
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { orgId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canCreate = await canManageRooms(session.user.id, orgId);
    if (!canCreate) {
      return NextResponse.json(
        { error: "Only ORG_ADMIN or PROJECT_LEAD can create meeting rooms" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { name, description, password, scheduledAt } = body;

    if (!name || !password) {
      return NextResponse.json(
        { error: "name and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const room = await prisma.meetingRoom.create({
      data: {
        organizationId: orgId,
        name,
        description: description ?? null,
        password: hashedPassword,
        createdById: session.user.id,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        scheduledAt: true,
        createdAt: true,
        createdBy: {
          select: { id: true, name: true, avatar: true, email: true },
        },
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("[POST /meetings]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
