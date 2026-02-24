// src/features/dashboard/types.ts

export interface DashboardColumn {
    id: string;
    name: string;
    order: number;
    isCompleted: boolean;
    issueCount: number;
}

export interface DashboardBoard {
    id: string;
    name: string;
    columns: DashboardColumn[];
    totalIssues: number;
}

export interface DashboardMember {
    id: string;
    name: string | null;
    avatar: string | null;
    email: string;
}

export interface DashboardProject {
    id: string;
    name: string;
    key: string;
    color: string;
    description: string | null;
    totalIssues: number;
    memberCount: number;
    members: DashboardMember[];
    boards: DashboardBoard[];
    defaultBoardId: string | null;
}

// Shape consumed by ColumnsChart
export interface IChart {
    columnTitle: string;
    tasks: number;
    color: string;
}