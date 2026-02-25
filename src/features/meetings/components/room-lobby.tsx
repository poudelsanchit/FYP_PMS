// src/features/meetings/components/room-lobby.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MeetingRoom } from "@/features/meetings/types/meeting.types";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import {
    ArrowLeft, Mic, MicOff, Video,
    VideoOff, Users, Loader2
} from "lucide-react";
import { format } from "date-fns";
import axios from "axios";

interface Props {
    room: MeetingRoom;
    orgId: string;
    onLeave: () => void;
    onEnterConference: (token: string, wsUrl: string, isHost: boolean) => void;
}

function getInitials(name: string | null, email: string) {
    if (name) return name.slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
}

export function RoomLobby({ room, orgId, onLeave, onEnterConference }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [camError, setCamError] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    // Start camera preview
    const startPreview = useCallback(async () => {
        try {
            setCamError(false);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setCamError(true);
            setCamOn(false);
        }
    }, []);

    // Stop camera preview (cleanup before joining)
    const stopPreview = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    useEffect(() => {
        startPreview();
        return () => stopPreview();
    }, [startPreview, stopPreview]);

    function toggleMic() {
        streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
        setMicOn(!micOn);
    }

    function toggleCam() {
        if (camError) return;
        streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
        setCamOn(!camOn);
        if (videoRef.current) {
            videoRef.current.style.opacity = camOn ? "0" : "1";
        }
    }

    async function handleJoinMeeting() {
        setIsJoining(true);
        setJoinError(null);
        try {
            stopPreview(); // release camera so LiveKit can take over
            const res = await axios.post(
                `/api/organizations/${orgId}/meetings/${room.id}/token`
            );
            const { token, wsUrl, isHost } = res.data;
            onEnterConference(token, wsUrl, isHost);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setJoinError(msg || "Failed to get access token");
            setIsJoining(false);
            startPreview(); // restart preview on error
        }
    }

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
            {/* Top bar */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
                    onClick={() => { stopPreview(); onLeave(); }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Meetings
                </Button>
                <Badge variant="outline" className="gap-1.5 text-xs border-green-500/30 text-green-600 dark:text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                </Badge>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-md mx-auto w-full">
                {/* Camera preview */}
                <div className="relative w-full aspect-video bg-muted rounded-2xl overflow-hidden border border-border">
                    {camError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <VideoOff className="w-10 h-10 opacity-30" />
                            <p className="text-xs">Camera unavailable</p>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover scale-x-[-1]"
                            style={{ opacity: camOn ? 1 : 0, transition: "opacity 0.2s" }}
                        />
                    )}

                    {/* Overlay when cam off */}
                    {!camOn && !camError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                                <VideoOff className="w-7 h-7 text-muted-foreground" />
                            </div>
                        </div>
                    )}

                    {/* Mic indicator overlay */}
                    <div className="absolute bottom-3 left-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${micOn ? "bg-black/40" : "bg-red-500/80"}`}>
                            {micOn
                                ? <Mic className="w-3.5 h-3.5 text-white" />
                                : <MicOff className="w-3.5 h-3.5 text-white" />
                            }
                        </div>
                    </div>
                </div>

                {/* Room info */}
                <div className="text-center">
                    <h2 className="text-xl font-semibold tracking-tight">{room.name}</h2>
                    {room.description && (
                        <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
                    )}
                    {room.scheduledAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(room.scheduledAt), "MMM d · h:mm a")}
                        </p>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{room.participantCount} in room</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                            <AvatarImage src={room.createdBy.avatar ?? undefined} />
                            <AvatarFallback className="text-[9px]">
                                {getInitials(room.createdBy.name, room.createdBy.email)}
                            </AvatarFallback>
                        </Avatar>
                        <span>{room.createdBy.name ?? room.createdBy.email}</span>
                    </div>
                </div>

                {/* Device controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleMic}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                            micOn
                                ? "bg-muted border-border text-muted-foreground hover:border-primary/40"
                                : "bg-red-500 border-red-500 text-white"
                        }`}
                    >
                        {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleCam}
                        disabled={camError}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all disabled:opacity-50 ${
                            camOn
                                ? "bg-muted border-border text-muted-foreground hover:border-primary/40"
                                : "bg-red-500 border-red-500 text-white"
                        }`}
                    >
                        {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                </div>

                {joinError && (
                    <p className="text-sm text-destructive text-center">{joinError}</p>
                )}

                {/* Join button */}
                <Button
                    size="lg"
                    className="w-full gap-2 text-base h-12"
                    onClick={handleJoinMeeting}
                    disabled={isJoining}
                >
                    {isJoining ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                    ) : (
                        "Join Meeting"
                    )}
                </Button>
            </div>
        </div>
    );
}