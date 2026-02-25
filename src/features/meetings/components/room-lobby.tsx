// src/features/meetings/components/RoomLobby.tsx
"use client";

import { MeetingRoom } from "@/features/meetings/types/meeting.types";
import { Button } from "@/core/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import {
    ArrowLeft, Users, Mic, MicOff, Video,
    VideoOff, MonitorUp, MessageSquare, Lock
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface Props {
    room: MeetingRoom;
    onLeave: () => void;
}

function getInitials(name: string | null, email: string) {
    if (name) return name.slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
}

export function RoomLobby({ room, onLeave }: Props) {
    const [micOn, setMicOn] = useState(false);
    const [camOn, setCamOn] = useState(false);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
            {/* Top bar */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
                        onClick={onLeave}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Meetings
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1.5 text-xs border-green-500/30 text-green-600 dark:text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </Badge>
                </div>
            </div>

            {/* Main lobby area */}
            <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-lg mx-auto w-full text-center">
                {/* Room icon */}
                <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-primary/60" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
                </div>

                {/* Room name */}
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">{room.name}</h2>
                    {room.description && (
                        <p className="text-muted-foreground mt-1.5 text-sm">{room.description}</p>
                    )}
                    {room.scheduledAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Scheduled for {format(new Date(room.scheduledAt), "MMMM d, yyyy · h:mm a")}
                        </p>
                    )}
                </div>

                {/* Waiting notice */}
                <div className="w-full bg-muted/50 border border-border rounded-xl px-6 py-5 space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <Users className="w-4 h-4" />
                        <span>{room.participantCount} participant{room.participantCount !== 1 ? "s" : ""} in this room</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                        You're in the lobby. Video conferencing will be available soon.
                        Prepare your mic and camera settings below.
                    </p>
                </div>

                {/* Device toggles */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMicOn(!micOn)}
                        className={`
                            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-150
                            ${micOn
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                            }
                        `}
                    >
                        {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setCamOn(!camOn)}
                        className={`
                            w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-150
                            ${camOn
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                            }
                        `}
                    >
                        {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                    <button className="w-12 h-12 rounded-full bg-muted text-muted-foreground border-2 border-border hover:border-primary/40 flex items-center justify-center transition-all">
                        <MonitorUp className="w-5 h-5" />
                    </button>
                    <button className="w-12 h-12 rounded-full bg-muted text-muted-foreground border-2 border-border hover:border-primary/40 flex items-center justify-center transition-all">
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>

                {/* Creator info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Hosted by</span>
                    <Avatar className="w-5 h-5">
                        <AvatarImage src={room.createdBy.avatar ?? undefined} />
                        <AvatarFallback className="text-[9px]">
                            {getInitials(room.createdBy.name, room.createdBy.email)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                        {room.createdBy.name ?? room.createdBy.email}
                    </span>
                </div>

                {/* Leave button */}
                <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
                    onClick={onLeave}
                >
                    Leave Room
                </Button>
            </div>
        </div>
    );
}