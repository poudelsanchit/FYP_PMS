// src/features/dashboard/components/ProjectCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardBoard, DashboardProject, IChart } from "../types/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/core/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { ColumnsChart } from "./Columnschart";

// Color bars by position: first = orange, middle = blue, completed = green
function getBarColor(isCompleted: boolean, order: number, total: number): string {
    if (isCompleted) return "#22c55e";
    if (order === 1) return "#f97316";
    if (order <= Math.ceil(total / 2)) return "#f59e0b";
    return "#3b82f6";
}

function boardToChartData(board: DashboardBoard): IChart[] {
    return board.columns.map((col) => ({
        columnTitle: col.name,
        tasks: col.issueCount,
        color: getBarColor(col.isCompleted, col.order, board.columns.length),
    }));
}

function getInitials(name: string | null, email: string): string {
    if (name) return name.slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
}

export function ProjectCard({
    project,
    tenantId,
}: {
    project: DashboardProject;
    tenantId: string;
}) {
    const router = useRouter();

    const [selectedBoardId, setSelectedBoardId] = useState<string>(
        project.defaultBoardId ?? project.boards[0]?.id ?? ""
    );

    const selectedBoard =
        project.boards.find((b) => b.id === selectedBoardId) ?? project.boards[0];

    const chartData: IChart[] = selectedBoard ? boardToChartData(selectedBoard) : [];

    // Progress: completed issues / total for selected board
    const completedCount =
        selectedBoard?.columns
            .filter((c) => c.isCompleted)
            .reduce((sum, c) => sum + c.issueCount, 0) ?? 0;
    const totalCount = selectedBoard?.totalIssues ?? 0;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const visibleMembers = project.members.slice(0, 3);
    const extraCount = project.memberCount - visibleMembers.length;

    return (
        <div
            className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => router.push(`/app/${tenantId}/projects/${project.id}`)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: project.color }}
                    />
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {project.totalIssues} issue{project.totalIssues !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Board switcher — stop click from navigating */}
                {project.boards.length > 1 ? (
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                            <SelectTrigger className="h-7 text-xs w-36 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {project.boards.map((board) => (
                                    <SelectItem key={board.id} value={board.id} className="text-xs">
                                        {board.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : project.boards.length === 1 ? (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                        {project.boards[0].name}
                    </span>
                ) : null}
            </div>

            {/* Chart */}
            <div className="min-h-[160px]">
                {project.boards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[160px] text-xs text-muted-foreground gap-1">
                        <span className="text-2xl opacity-30">📋</span>
                        No boards yet
                    </div>
                ) : (
                    <ColumnsChart chartData={chartData} />
                )}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{completedCount} of {totalCount} completed</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Footer: avatars + member count */}
            <div className="flex items-center justify-between pt-1 border-t border-border">
                {/* Avatar stack */}
                <div className="flex items-center">
                    {visibleMembers.map((member, i) => (
                        <Avatar
                            key={member.id}
                            className="w-6 h-6 border-2 border-card"
                            style={{
                                marginLeft: i === 0 ? 0 : "-6px",
                                zIndex: visibleMembers.length - i,
                            }}
                        >
                            <AvatarImage src={member.avatar ?? undefined} />
                            <AvatarFallback className="text-[9px] bg-muted">
                                {getInitials(member.name, member.email)}
                            </AvatarFallback>
                        </Avatar>
                    ))}
                    {extraCount > 0 && (
                        <span
                            className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground font-medium"
                            style={{ marginLeft: "-6px" }}
                        >
                            +{extraCount}
                        </span>
                    )}
                </div>

                {/* Member count */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                    {project.memberCount}
                </div>
            </div>
        </div>
    );
}