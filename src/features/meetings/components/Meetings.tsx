// src/features/meetings/components/Meetings.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { Plus, Video } from "lucide-react";
import { Skeleton } from "@/core/components/ui/skeleton";
import { MeetingRoom } from "../types/meeting.types";
import { useMeetings } from "../hooks/useMeeting";
import { RoomLobby } from "./room-lobby";
import { Button } from "@/core/components/ui/button";
import { MeetingRoomCard } from "./meeting-room-card";
import { CreateRoomDialog } from "./create-room";
import { JoinRoomDialog } from "./join-room";

function CardSkeleton() {
    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20 ml-auto" />
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
            </div>
        </div>
    );
}

export default function Meetings() {
    const { setSegments, clear } = useBreadcrumbStore();
    const params = useParams();
    const tenantId = params?.tenantId as string;

    const { rooms, isLoading, error, createRoom, joinRoom, leaveRoom } = useMeetings(tenantId);

    const [showCreate, setShowCreate] = useState(false);
    const [joinTarget, setJoinTarget] = useState<MeetingRoom | null>(null);
    const [activeRoom, setActiveRoom] = useState<MeetingRoom | null>(null);

    useEffect(() => {
        if (activeRoom) {
            setSegments([{ label: "Meetings", href: "#" }, { label: activeRoom.name }]);
        } else {
            setSegments([{ label: "Meetings" }]);
        }
        return () => clear();
    }, [setSegments, clear, activeRoom]);

    // If user is in a room lobby, show that view
    if (activeRoom) {
        return (
            <div className="p-6">
                <RoomLobby
                    room={activeRoom}
                    onLeave={async () => {
                        await leaveRoom(activeRoom.id);
                        setActiveRoom(null);
                    }}
                />
            </div>
        );
    }

    const activeRooms = rooms.filter((r) => r.isActive);
    const endedRooms = rooms.filter((r) => !r.isActive);

    return (
        <div className="p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Join a room or create one for your team
                    </p>
                </div>
                <Button className="gap-2" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4" />
                    New Room
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6">
                    {error}
                </div>
            )}

            {/* Active rooms */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : activeRooms.length === 0 && endedRooms.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <Video className="w-7 h-7 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">No meeting rooms yet</p>
                    <p className="text-xs mt-1 mb-4">Create a room to start collaborating with your team</p>
                    <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        Create First Room
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Active */}
                    {activeRooms.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                                Active Rooms · {activeRooms.length}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {activeRooms.map((room) => (
                                    <MeetingRoomCard
                                        key={room.id}
                                        room={room}
                                        onJoinClick={setJoinTarget}
                                        onEnterClick={setActiveRoom}
                                        onLeaveClick={leaveRoom}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ended */}
                    {endedRooms.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
                                Ended Rooms · {endedRooms.length}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {endedRooms.map((room) => (
                                    <MeetingRoomCard
                                        key={room.id}
                                        room={room}
                                        onJoinClick={setJoinTarget}
                                        onEnterClick={setActiveRoom}
                                        onLeaveClick={leaveRoom}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dialogs */}
            <CreateRoomDialog
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreate={createRoom}
            />

            <JoinRoomDialog
                room={joinTarget}
                onClose={() => setJoinTarget(null)}
                onJoin={async (roomId, password) => {
                    await joinRoom(roomId, password);
                    // After joining, find the room and enter the lobby
                    const room = rooms.find((r) => r.id === roomId);
                    if (room) {
                        setJoinTarget(null);
                        setActiveRoom({ ...room, hasJoined: true, participantCount: room.participantCount + 1 });
                    }
                }}
            />
        </div>
    );
}