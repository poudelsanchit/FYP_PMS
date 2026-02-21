import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; status?: number };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/** Get the authenticated user ID from NextAuth session */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
