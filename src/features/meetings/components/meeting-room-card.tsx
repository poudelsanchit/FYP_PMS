// src/features/meetings/components/MeetingRoomCard.tsx
"use client";

import { MeetingRoom } from "@/features/meetings/types/meeting.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Users, Lock, Calendar, LogIn, CheckCircle2, VideoOff } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Props {
    room: MeetingRoom;
    onJoinClick: (room: MeetingRoom) => void;
    onEnterClick: (room: MeetingRoom) => void;
    onLeaveClick: (roomId: string) => void;
}

function getInitials(name: string | null, email: string) {
    if (name) return name.slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
}

export function MeetingRoomCard({ room, onJoinClick, onEnterClick, onLeaveClick }: Props) {
    const isScheduled = room.scheduledAt && new Date(room.scheduledAt) > new Date();

    return (
        <div
            className={`
                group relative bg-card border border-border rounded-sm p-5 flex flex-col gap-4 transition-all duration-200
                ${room.isActive
                    ? "border-border hover:border-primary/30  cursor-pointer"
                    : "border-border/50 opacity-60 cursor-default"
                }
                ${room.hasJoined ? "ring-1 ring-primary/20" : ""}
            `}
            onClick={() => {
                if (!room.isActive) return;
                if (room.hasJoined) onEnterClick(room);
                else onJoinClick(room);
            }}
        >


            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    {/* Room icon */}
                    <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${room.isActive
                            ? room.hasJoined
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            : "bg-muted text-muted-foreground"
                        }
                    `}>
                        {room.isActive ? <Lock className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight truncate">{room.name}</h3>
                        {room.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{room.description}</p>
                        )}
                    </div>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                    {!room.isActive ? (
                        <Badge variant="secondary" className="text-xs">Ended</Badge>
                    ) : room.hasJoined ? (
                        <Badge className="text-xs bg-primary/15 text-primary border-primary/20 hover:bg-primary/15">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Joined
                        </Badge>
                    ) : isScheduled ? (
                        <Badge variant="outline" className="text-xs">Scheduled</Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs border-green-700/30 text-green-600 dark:text-green-400 px-4">
                            <div className="w-[5px] h-[5px] rounded-full bg-green-700  animate-pulse" />
                            Live
                        </Badge>
                    )}
                </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{room.participantCount} participant{room.participantCount !== 1 ? "s" : ""}</span>
                </div>

                {room.scheduledAt && (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(room.scheduledAt), "MMM d, h:mm a")}</span>
                    </div>
                )}

                <span className="ml-auto">
                    {formatDistanceToNow(new Date(room.createdAt), { addSuffix: true })}
                </span>
            </div>

            {/* Footer: creator + action */}
            <div
                className="flex items-center justify-between pt-3 border-t border-border"
                onClick={(e) => e.stopPropagation()} // prevent card click when clicking buttons
            >
                <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                        <AvatarImage src={room.createdBy.avatar ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                            {getInitials(room.createdBy.name, room.createdBy.email)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {room.createdBy.name ?? room.createdBy.email}
                    </span>
                </div>

                {room.isActive && (
                    room.hasJoined ? (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => onLeaveClick(room.id)}
                            >
                                Leave
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 text-xs gap-1.5"
                                onClick={() => onEnterClick(room)}
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                Enter Room
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            className="h-7 text-xs gap-1.5 rounded-sm "
                            onClick={() => onJoinClick(room)}
                        >
                            <Lock className="w-3 h-3" />
                            Join
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}