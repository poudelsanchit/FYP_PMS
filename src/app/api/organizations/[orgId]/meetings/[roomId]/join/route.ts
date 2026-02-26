// src/app/api/organizations/[orgId]/meetings/[roomId]/join/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { canManageRooms, isOrgMember } from "@/core/lib/meetings/meetingAuth";
import { prisma } from "@/core/lib/prisma/prisma";

type Params = { params: Promise<{ orgId: string; roomId: string }> };

// POST /api/organizations/[orgId]/meetings/[roomId]/join
// Any org member can join if they provide the correct password
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { orgId, roomId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be org member to even attempt joining
    const member = await isOrgMember(session.user.id, orgId);
    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 },
      );
    }

    const room = await prisma.meetingRoom.findFirst({
      where: { id: roomId, organizationId: orgId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: "This room has been closed" },
        { status: 410 },
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    // Verify password
    const isCorrect = await bcrypt.compare(password, room.password);
    if (!isCorrect) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // Add participant (upsert so rejoining doesn't throw)
    await prisma.meetingParticipant.upsert({
      where: { roomId_userId: { roomId, userId: session.user.id } },
      update: { joinedAt: new Date() }, // refresh join time on rejoin
      create: { roomId, userId: session.user.id },
    });

    return NextResponse.json({
      message: "Joined successfully",
      roomId,
      roomName: room.name,
    });
  } catch (error) {
    console.error("[POST /meetings/[roomId]/join]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
