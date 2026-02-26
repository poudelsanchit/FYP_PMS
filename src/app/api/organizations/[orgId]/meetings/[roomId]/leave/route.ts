// src/app/api/organizations/[orgId]/meetings/[roomId]/leave/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";
import { prisma } from "@/core/lib/prisma/prisma";

type Params = { params: Promise<{ orgId: string; roomId: string }> };

// POST /api/organizations/[orgId]/meetings/[roomId]/leave
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { roomId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participant = await prisma.meetingParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: session.user.id } },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not in this room" },
        { status: 400 },
      );
    }

    await prisma.meetingParticipant.delete({
      where: { roomId_userId: { roomId, userId: session.user.id } },
    });

    return NextResponse.json({ message: "Left room successfully" });
  } catch (error) {
    console.error("[POST /meetings/[roomId]/leave]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
