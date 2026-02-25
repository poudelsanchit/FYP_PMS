// src/features/meetings/components/video-conference.tsx
"use client";

import "@livekit/components-styles";
import {
    LiveKitRoom,
    useTracks,
    useParticipants,
    useLocalParticipant,
    useRoomContext,
    VideoTrack,
    AudioTrack,
    TrackMutedIndicator,
    useIsSpeaking,
    useDataChannel,
    GridLayout,
    TrackRefContext,
    useTrackRefContext,
    ParticipantName,
    ParticipantContext,
    TrackReference,
    TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import {
    Track,
    LocalParticipant,
    RemoteParticipant,
    Participant,
    TrackPublication,
} from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Input } from "@/core/components/ui/input";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import {
    Mic, MicOff, Video, VideoOff, MonitorUp,
    MessageSquare, Users, PhoneOff, X, Send,
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Date;
}

interface ConferenceProps {
    token: string;
    wsUrl: string;
    roomId: string;
    orgId: string;
    isHost: boolean;
    roomName: string;
    onLeave: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}

// Safely narrow TrackReferenceOrPlaceholder → TrackReference
function isTrackReference(ref: TrackReferenceOrPlaceholder): ref is TrackReference {
    return ref.publication !== undefined;
}

// Build a full TrackReference — required by VideoTrack / AudioTrack
function makeTrackRef(
    participant: Participant,
    source: Track.Source
): TrackReference | null {
    const publication = participant.getTrackPublication(source);
    if (!publication) return null;
    return { participant, source, publication } as TrackReference;
}

// ─── Participant Tile ─────────────────────────────────────────────────────────

function ParticipantTileInner({ participant }: { participant: Participant }) {
    const trackRef = useTrackRefContext();
    const isSpeaking = useIsSpeaking(participant);

    // Only render video if this is a real TrackReference with a publication
    const hasVideo =
        isTrackReference(trackRef) &&
        trackRef.source === Track.Source.Camera &&
        !trackRef.publication.isMuted;

    // Build audio ref for remote participants only
    const audioRef = makeTrackRef(participant, Track.Source.Microphone);
    const isRemote = !(participant instanceof LocalParticipant);

    // Debug logging
    useEffect(() => {
        console.log("=== ParticipantTile Debug ===");
        console.log("Participant:", participant.identity, participant.name);
        console.log("Is remote:", isRemote);
        console.log("Has video (will render VideoTrack):", hasVideo);
    }, [participant, trackRef, hasVideo, isRemote]);

    return (
        <div
            className={`
                relative w-full h-full bg-neutral-900 rounded-xl overflow-hidden
                flex items-center justify-center transition-all duration-150
                ${isSpeaking ? "ring-2 ring-green-400 ring-offset-1 ring-offset-neutral-950" : ""}
            `}
        >
            {hasVideo ? (
                <>
                    <VideoTrack
                        trackRef={trackRef as TrackReference}
                        className="w-full h-full object-cover"
                    />
                </>
            ) : (
                <>
                    <Avatar className="w-16 h-16">
                        <AvatarFallback className="text-xl bg-neutral-800 text-neutral-200">
                            {getInitials(participant.name ?? participant.identity)}
                        </AvatarFallback>
                    </Avatar>
                </>
            )}

            {/* Name + mute indicator */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-md">
                {makeTrackRef(participant, Track.Source.Microphone) && (
                    <TrackMutedIndicator
                        trackRef={makeTrackRef(participant, Track.Source.Microphone)!}
                        className="w-3 h-3 text-red-400"
                    />
                )}
                <ParticipantName
                    participant={participant}
                    className="text-xs text-white font-medium"
                />
                {isSpeaking && (
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                )}
            </div>

            {/* Render audio only for remote participants */}
            {isRemote && audioRef && (
                <AudioTrack trackRef={audioRef} />
            )}
        </div>
    );
}

// ─── Video Grid ───────────────────────────────────────────────────────────────

function VideoGrid() {
    const { localParticipant } = useLocalParticipant();
    const allTracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    const screenShareTrack = allTracks.find(
        (t) => t.source === Track.Source.ScreenShare && isTrackReference(t)
    ) as TrackReference | undefined;

    const cameraTracks = allTracks.filter(
        (t) => t.source === Track.Source.Camera
    );

    // Debug logging
    useEffect(() => {
        console.log("=== VideoGrid Debug ===");
        console.log("Local participant:", localParticipant.identity);
        console.log("Total tracks:", allTracks.length);
        console.log("Camera tracks:", cameraTracks.length);
    }, [allTracks, cameraTracks, localParticipant]);

    if (screenShareTrack) {
        return (
            <div className="flex flex-1 gap-2 overflow-hidden">
                {/* Screenshare fills main area */}
                <div className="flex-1 rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center">
                    <VideoTrack
                        trackRef={screenShareTrack}
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Camera strip on the right */}
                <div className="w-40 flex flex-col gap-2 overflow-y-auto">
                    {cameraTracks.map((trackRef, i) => (
                        <div
                            key={`${trackRef.participant.identity}-${i}`}
                            className="aspect-video rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0"
                        >
                            <TrackRefContext.Provider value={trackRef}>
                                <ParticipantContext.Provider value={trackRef.participant}>
                                    <ParticipantTileInner participant={trackRef.participant} />
                                </ParticipantContext.Provider>
                            </TrackRefContext.Provider>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden p-4">
            <div className={`grid gap-4 h-full ${
                cameraTracks.length === 1 ? 'grid-cols-1' :
                cameraTracks.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                cameraTracks.length <= 4 ? 'grid-cols-2' :
                cameraTracks.length <= 6 ? 'grid-cols-2 lg:grid-cols-3' :
                'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
                {cameraTracks.map((trackRef, i) => {
                    return (
                        <div
                            key={`${trackRef.participant.identity}-${i}`}
                            className="bg-neutral-900 rounded-xl overflow-hidden min-h-[200px]"
                        >
                            <TrackRefContext.Provider value={trackRef}>
                                <ParticipantContext.Provider value={trackRef.participant}>
                                    <ParticipantTileInner participant={trackRef.participant} />
                                </ParticipantContext.Provider>
                            </TrackRefContext.Provider>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({ 
    onClose, 
    messages, 
    onSendMessage 
}: { 
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
}) {
    const { localParticipant } = useLocalParticipant();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }, [messages]);

    function sendMessage() {
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput("");
    }

    return (
        <div className="w-72 flex flex-col bg-neutral-900 border-l border-neutral-800 h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-100">Chat</span>
                </div>
                <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <ScrollArea className="flex-1 px-4 py-3">
                {messages.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center mt-8">No messages yet. Say hi! 👋</p>
                ) : (
                    <div className="space-y-3">
                        {messages.map((msg) => {
                            const isMe = msg.senderId === localParticipant?.identity;
                            return (
                                <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                                    <span className="text-[10px] text-neutral-500">
                                        {isMe ? "You" : msg.senderName} · {format(msg.timestamp, "HH:mm")}
                                    </span>
                                    <div className={`
                                        max-w-[200px] px-3 py-2 rounded-xl text-sm break-words
                                        ${isMe
                                            ? "bg-primary text-primary-foreground rounded-br-sm"
                                            : "bg-neutral-800 text-neutral-100 rounded-bl-sm"
                                        }
                                    `}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            <div className="px-3 py-3 border-t border-neutral-800 flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message..."
                    className="bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 text-sm h-9"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                />
                <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={sendMessage} disabled={!input.trim()}>
                    <Send className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ─── Participants Panel ───────────────────────────────────────────────────────

function ParticipantsPanel({ onClose }: { onClose: () => void }) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    
    // Filter out local participant from remote participants list
    const remoteParticipants = participants.filter(p => p.identity !== localParticipant.identity);
    const totalCount = remoteParticipants.length + 1; // +1 for local

    return (
        <div className="w-64 flex flex-col bg-neutral-900 border-l border-neutral-800 h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-100">
                        Participants ({totalCount})
                    </span>
                </div>
                <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <ScrollArea className="flex-1 px-3 py-2">
                <div className="space-y-1">
                    <ParticipantRow participant={localParticipant} isLocal />
                    {remoteParticipants.map((p) => (
                        <ParticipantRow key={p.identity} participant={p} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

function ParticipantRow({ participant, isLocal }: { participant: Participant; isLocal?: boolean }) {
    const isSpeaking = useIsSpeaking(participant);
    const micPub = participant.getTrackPublication(Track.Source.Microphone);
    const camPub = participant.getTrackPublication(Track.Source.Camera);

    return (
        <div className={`
            flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors
            ${isSpeaking ? "bg-green-500/10" : "hover:bg-neutral-800"}
        `}>
            <div className="relative">
                <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-[10px] bg-neutral-700 text-neutral-200">
                        {getInitials(participant.name ?? participant.identity)}
                    </AvatarFallback>
                </Avatar>
                {isSpeaking && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-neutral-900" />
                )}
            </div>
            <span className="flex-1 text-xs text-neutral-200 truncate">
                {participant.name ?? participant.identity}
                {isLocal && <span className="text-neutral-500 ml-1">(you)</span>}
            </span>
            <div className="flex items-center gap-1">
                {micPub?.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                {camPub?.isMuted && <VideoOff className="w-3 h-3 text-neutral-500" />}
            </div>
        </div>
    );
}

// ─── Control Bar ──────────────────────────────────────────────────────────────

function ControlBar({
    isHost, onEndMeeting, onLeave,
    onToggleChat, onToggleParticipants,
    chatOpen, participantsOpen, participantCount,
}: {
    isHost: boolean;
    onEndMeeting: () => void;
    onLeave: () => void;
    onToggleChat: () => void;
    onToggleParticipants: () => void;
    chatOpen: boolean;
    participantsOpen: boolean;
    participantCount: number;
}) {
    const { localParticipant } = useLocalParticipant();
    const [micEnabled, setMicEnabled] = useState(true);
    const [camEnabled, setCamEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);

    // Ensure camera and mic are enabled on mount
    useEffect(() => {
        const enableDevices = async () => {
            try {
                await localParticipant.setMicrophoneEnabled(true);
                await localParticipant.setCameraEnabled(true);
                
                // Sync state with actual publications after a short delay
                setTimeout(() => {
                    const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);
                    const camPub = localParticipant.getTrackPublication(Track.Source.Camera);
                    
                    setMicEnabled(!micPub?.isMuted);
                    setCamEnabled(!camPub?.isMuted);
                }, 500);
            } catch (err) {
                console.error("Failed to enable devices:", err);
            }
        };
        enableDevices();
    }, [localParticipant]);

    async function toggleMic() {
        await localParticipant.setMicrophoneEnabled(!micEnabled);
        setMicEnabled(!micEnabled);
    }
    async function toggleCam() {
        await localParticipant.setCameraEnabled(!camEnabled);
        setCamEnabled(!camEnabled);
    }
    async function toggleScreenShare() {
        if (screenSharing) {
            await localParticipant.setScreenShareEnabled(false);
            setScreenSharing(false);
        } else {
            try {
                await localParticipant.setScreenShareEnabled(true);
                setScreenSharing(true);
            } catch { /* cancelled */ }
        }
    }

    return (
        <div className="h-16 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between px-6 flex-shrink-0">
            <div className="text-sm text-neutral-400 hidden sm:block w-40">
                {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </div>

            <div className="flex items-center gap-2">
                <button onClick={toggleMic} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${micEnabled ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700" : "bg-red-500 text-white"}`}>
                    {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button onClick={toggleCam} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${camEnabled ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700" : "bg-red-500 text-white"}`}>
                    {camEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <button onClick={toggleScreenShare} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${screenSharing ? "bg-primary text-primary-foreground" : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"}`}>
                    <MonitorUp className="w-4 h-4" />
                </button>
                <button onClick={onLeave} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all ml-2">
                    <PhoneOff className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-2 w-40 justify-end">
                <button onClick={onToggleParticipants} className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${participantsOpen ? "bg-primary/20 text-primary" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}>
                    <Users className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                        {participantCount}
                    </span>
                </button>
                <button onClick={onToggleChat} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${chatOpen ? "bg-primary/20 text-primary" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}>
                    <MessageSquare className="w-4 h-4" />
                </button>
                {isHost && (
                    <Button size="sm" variant="destructive" className="text-xs h-8 px-3" onClick={onEndMeeting}>
                        End
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Room Ended Overlay ───────────────────────────────────────────────────────

function RoomEndedOverlay({ onLeave }: { onLeave: () => void }) {
    return (
        <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center z-50 gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <PhoneOff className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Meeting Ended</h2>
            <p className="text-neutral-400 text-sm">The host has ended this meeting</p>
            <Button variant="outline" onClick={onLeave} className="mt-2">Return to Meetings</Button>
        </div>
    );
}

// ─── Inner Conference ─────────────────────────────────────────────────────────

function InnerConference({ isHost, roomId, orgId, roomName, onLeave }: {
    isHost: boolean;
    roomId: string;
    orgId: string;
    roomName: string;
    onLeave: () => void;
}) {
    const room = useRoomContext();
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const [chatOpen, setChatOpen] = useState(false);
    const [participantsOpen, setParticipantsOpen] = useState(false);
    const [roomEnded, setRoomEnded] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Debug room connection
    useEffect(() => {
        console.log("Room connected:", room.state === "connected");
    }, [room]);

    // Listen to chat messages at room level (always listening, even when chat panel is closed)
    const { message: lastMessage } = useDataChannel("chat");
    useEffect(() => {
        if (!lastMessage) return;
        try {
            const decoded = new TextDecoder().decode(lastMessage.payload);
            const parsed = JSON.parse(decoded) as ChatMessage;
            setChatMessages((prev) => {
                // Avoid duplicates
                if (prev.some(m => m.id === parsed.id)) return prev;
                return [...prev, { ...parsed, timestamp: new Date(parsed.timestamp) }];
            });
        } catch { /* ignore */ }
    }, [lastMessage]);

    const { message: dataMessage } = useDataChannel("system");
    useEffect(() => {
        if (!dataMessage) return;
        try {
            const decoded = new TextDecoder().decode(dataMessage.payload);
            const parsed = JSON.parse(decoded);
            if (parsed.type === "ROOM_ENDED") setRoomEnded(true);
        } catch { /* ignore */ }
    }, [dataMessage]);

    function handleSendMessage(text: string) {
        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            senderId: localParticipant.identity,
            senderName: localParticipant.name ?? localParticipant.identity,
            text,
            timestamp: new Date(),
        };
        const encoded = new TextEncoder().encode(JSON.stringify(msg));
        localParticipant.publishData(encoded, { reliable: true, topic: "chat" });
        setChatMessages((prev) => [...prev, msg]);
    }

    async function handleEndMeeting() {
        const msg = new TextEncoder().encode(JSON.stringify({ type: "ROOM_ENDED" }));
        localParticipant.publishData(msg, { reliable: true, topic: "system" });
        try { await axios.delete(`/api/organizations/${orgId}/meetings/${roomId}`); } catch { /* ignore */ }
        room.disconnect();
        onLeave();
    }

    return (
        <div className="relative flex flex-col h-full bg-neutral-950">
            <div className="flex items-center justify-between px-4 h-12 border-b border-neutral-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1.5 text-xs border-green-500/40 text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                    </Badge>
                    <span className="text-sm font-medium text-neutral-200">{roomName}</span>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex flex-col flex-1 p-3 gap-3 overflow-hidden">
                    <VideoGrid />
                    <ControlBar
                        isHost={isHost}
                        onEndMeeting={handleEndMeeting}
                        onLeave={() => { room.disconnect(); onLeave(); }}
                        onToggleChat={() => { setChatOpen(!chatOpen); setParticipantsOpen(false); }}
                        onToggleParticipants={() => { setParticipantsOpen(!participantsOpen); setChatOpen(false); }}
                        chatOpen={chatOpen}
                        participantsOpen={participantsOpen}
                        participantCount={participants.filter(p => p.identity !== localParticipant.identity).length + 1}
                    />
                </div>
                {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} messages={chatMessages} onSendMessage={handleSendMessage} />}
                {participantsOpen && <ParticipantsPanel onClose={() => setParticipantsOpen(false)} />}
            </div>

            {roomEnded && <RoomEndedOverlay onLeave={onLeave} />}
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function VideoConference({ token, wsUrl, roomId, orgId, isHost, roomName, onLeave }: ConferenceProps) {
    return (
        <div className="fixed inset-0 z-50 bg-neutral-950">
            <LiveKitRoom
                token={token}
                serverUrl={wsUrl}
                connect={true}
                audio={true}
                video={true}
                onDisconnected={onLeave}
                className="h-full"
            >
                <InnerConference
                    isHost={isHost}
                    roomId={roomId}
                    orgId={orgId}
                    roomName={roomName}
                    onLeave={onLeave}
                />
            </LiveKitRoom>
        </div>
    );
}