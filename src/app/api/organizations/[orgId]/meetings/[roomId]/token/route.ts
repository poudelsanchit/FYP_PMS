// src/app/api/organizations/[orgId]/meetings/[roomId]/token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";

type Params = { params: Promise<{ orgId: string; roomId: string }> };

// POST /api/organizations/[orgId]/meetings/[roomId]/token
// Returns a LiveKit token — only for users who have already joined (password verified)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { orgId, roomId } = await params;

    // ── Auth: get current user from session ──────────────────────────
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify room exists and belongs to this org
    const room = await prisma.meetingRoom.findFirst({
      where: { id: roomId, organizationId: orgId },
      include: { createdBy: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: "This room has ended" },
        { status: 410 },
      );
    }

    // Verify the user has already joined (passed password check)
    const participant = await prisma.meetingParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { user: true },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You must join the room with the password first" },
        { status: 403 },
      );
    }

    // Check if user is the host (room creator or ORG_ADMIN)
    const orgMember = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    const isHost =
      room.createdById === userId || orgMember?.role === "ORG_ADMIN";

    // Generate LiveKit token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit not configured" },
        { status: 500 },
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: participant.user.name ?? participant.user.email,
      ttl: "4h",
      metadata: JSON.stringify({ isHost, orgId }),
    });

    token.addGrant({
      roomJoin: true,
      room: roomId, // use room DB id as LiveKit room name
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return NextResponse.json({
      token: jwt,
      wsUrl: process.env.LIVEKIT_WS_URL,
      isHost,
      roomName: room.name,
    });
  } catch (error) {
    console.error("[POST /meetings/[roomId]/token]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
