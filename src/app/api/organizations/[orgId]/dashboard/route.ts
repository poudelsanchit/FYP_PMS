// src/app/api/organizations/[orgId]/dashboard/route.ts

import { prisma } from "@/core/lib/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/lib/auth/authOptions";

// GET /api/organizations/[orgId]/dashboard
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organization = await prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const projects = await prisma.project.findMany({
            where: { 
                organizationId: orgId,
                members: {
                    some: {
                        userId: session.user.id
                    }
                }
            },
            include: {
                boards: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        columns: {
                            orderBy: { order: "asc" },
                            include: {
                                _count: {
                                    select: { issues: true },
                                },
                            },
                        },
                    },
                },
                members: {
                    take: 4,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { issues: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const data = projects.map((project) => {
            const boards = project.boards.map((board) => ({
                id: board.id,
                name: board.name,
                columns: board.columns.map((col) => ({
                    id: col.id,
                    name: col.name,
                    order: col.order,
                    isCompleted: col.isCompleted,
                    issueCount: col._count.issues,
                })),
                totalIssues: board.columns.reduce(
                    (sum, col) => sum + col._count.issues,
                    0
                ),
            }));

            return {
                id: project.id,
                name: project.name,
                key: project.key,
                color: project.color ?? "#3b82f6",
                description: project.description,
                totalIssues: project._count.issues,
                memberCount: project.members.length,
                members: project.members.map((m) => m.user),
                boards,
                defaultBoardId: boards[0]?.id ?? null,
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("[GET /api/organizations/[orgId]/dashboard]", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}