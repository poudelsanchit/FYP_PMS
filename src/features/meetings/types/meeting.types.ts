// src/features/meetings/types.ts

export interface MeetingMember {
    id: string;
    name: string | null;
    avatar: string | null;
    email: string;
}

export interface MeetingRoom {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    scheduledAt: string | null;
    endedAt: string | null;
    createdAt: string;
    createdBy: MeetingMember;
    participantCount: number;
    hasJoined: boolean;
}