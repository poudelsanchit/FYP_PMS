// src/features/meetings/components/Meetings.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { Plus, Video } from "lucide-react";
import { Skeleton } from "@/core/components/ui/skeleton";
import { MeetingRoom } from "../types/meeting.types";
import { useMeetings } from "../hooks/useMeeting";
import { Button } from "@/core/components/ui/button";
import { MeetingRoomCard } from "./meeting-room-card";
import { CreateRoomDialog } from "./create-room";
import { JoinRoomDialog } from "./join-room";
import { RoomLobby } from "./room-lobby";
import { VideoConference } from "./video-conference";

type Stage = "list" | "lobby" | "conference";

interface ConferenceState {
    token: string;
    wsUrl: string;
    isHost: boolean;
}

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

    const { rooms, isLoading, error, createRoom, joinRoom, leaveRoom, refetch } = useMeetings(tenantId);

    const [stage, setStage] = useState<Stage>("list");
    const [activeRoom, setActiveRoom] = useState<MeetingRoom | null>(null);
    const [conference, setConference] = useState<ConferenceState | null>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [joinTarget, setJoinTarget] = useState<MeetingRoom | null>(null);

    useEffect(() => {
        if (stage === "conference" && activeRoom) {
            setSegments([
                { label: "Meetings", href: `/app/${tenantId}/meetings` }, 
                { label: activeRoom.name, href: `/app/${tenantId}/meetings` }, 
                { label: "In Meeting" }
            ]);
        } else if (stage === "lobby" && activeRoom) {
            setSegments([
                { label: "Meetings", href: `/app/${tenantId}/meetings` }, 
                { label: activeRoom.name }
            ]);
        } else {
            setSegments([{ label: "Meetings" }]);
        }
        return () => clear();
    }, [setSegments, clear, stage, activeRoom, tenantId]);

    // ── Stage: Conference (fullscreen takeover) ────────────────────────────────
    if (stage === "conference" && activeRoom && conference) {
        return (
            <VideoConference
                token={conference.token}
                wsUrl={conference.wsUrl}
                roomId={activeRoom.id}
                orgId={tenantId}
                isHost={conference.isHost}
                roomName={activeRoom.name}
                onLeave={async () => {
                    // leave in DB too
                    try { await leaveRoom(activeRoom.id); } catch { /* ignore */ }
                    setConference(null);
                    setActiveRoom(null);
                    setStage("list");
                    refetch();
                }}
            />
        );
    }

    // ── Stage: Lobby (pre-join camera check) ──────────────────────────────────
    if (stage === "lobby" && activeRoom) {
        return (
            <div className="p-6">
                <RoomLobby
                    room={activeRoom}
                    orgId={tenantId}
                    onLeave={async () => {
                        try { await leaveRoom(activeRoom.id); } catch { /* ignore */ }
                        setActiveRoom(null);
                        setStage("list");
                        refetch();
                    }}
                    onEnterConference={(token, wsUrl, isHost) => {
                        setConference({ token, wsUrl, isHost });
                        setStage("conference");
                    }}
                />
            </div>
        );
    }

    // ── Stage: List ────────────────────────────────────────────────────────────
    const activeRooms = rooms.filter((r) => r.isActive);
    const endedRooms = rooms.filter((r) => !r.isActive);

    return (
        <div className="p-6 w-full">
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

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
            ) : activeRooms.length === 0 && endedRooms.length === 0 ? (
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
                                        onEnterClick={(r) => { setActiveRoom(r); setStage("lobby"); }}
                                        onLeaveClick={leaveRoom}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

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
                                        onEnterClick={(r) => { setActiveRoom(r); setStage("lobby"); }}
                                        onLeaveClick={leaveRoom}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                    const room = rooms.find((r) => r.id === roomId);
                    if (room) {
                        setJoinTarget(null);
                        setActiveRoom({ ...room, hasJoined: true, participantCount: room.participantCount + 1 });
                        setStage("lobby");
                    }
                }}
            />
        </div>
    );
}