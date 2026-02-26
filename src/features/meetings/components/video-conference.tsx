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
    Participant,
} from "livekit-client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Input } from "@/core/components/ui/input";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import {
    Mic, MicOff, Video, VideoOff, MonitorUp,
    MessageSquare, Users, PhoneOff, X, Send, Smile,
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

interface EmojiReaction {
    id: string;
    emoji: string;
    senderName: string;
    x: number;
}

interface HandRaiseEntry {
    identity: string;
    name: string;
    raisedAt: number;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "👏", "🎉", "🔥", "💯"];
const REACTION_LIFETIME_MS = 2200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}

function isTrackReference(ref: TrackReferenceOrPlaceholder): ref is TrackReference {
    return ref.publication !== undefined;
}

function makeTrackRef(
    participant: Participant,
    source: Track.Source
): TrackReference | null {
    const publication = participant.getTrackPublication(source);
    if (!publication) return null;
    return { participant, source, publication } as TrackReference;
}

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
    @keyframes floatUp {
        0%   { transform: translateY(0)     scale(1);    opacity: 1; }
        60%  { transform: translateY(-80px) scale(1.25); opacity: 1; }
        100% { transform: translateY(-140px) scale(0.9); opacity: 0; }
    }
    .emoji-reaction {
        animation: floatUp 2.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
    }
    @keyframes emojiTrayIn {
        0%   { opacity: 0; transform: translateY(8px)  scale(0.9); }
        100% { opacity: 1; transform: translateY(0)    scale(1);   }
    }
    .emoji-tray-enter { animation: emojiTrayIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

    @keyframes handWave {
        0%,100% { transform: rotate(0deg);  transform-origin: 70% 70%; }
        10%     { transform: rotate(14deg); }
        20%     { transform: rotate(-8deg); }
        30%     { transform: rotate(14deg); }
        40%     { transform: rotate(-4deg); }
        50%     { transform: rotate(10deg); }
        60%     { transform: rotate(0deg);  }
    }
    .hand-wave { animation: handWave 0.9s ease-in-out; }

    @keyframes slideInRight {
        0%   { opacity: 0; transform: translateX(110%); }
        100% { opacity: 1; transform: translateX(0);    }
    }
    .hand-toast-enter { animation: slideInRight 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) forwards; }

    @keyframes popIn {
        0%   { opacity: 0; transform: scale(0.4); }
        70%  { transform: scale(1.25); }
        100% { opacity: 1; transform: scale(1);   }
    }
    .pop-in { animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

    @keyframes fadeSlideDown {
        0%   { opacity: 0; transform: translateY(-6px); }
        100% { opacity: 1; transform: translateY(0);    }
    }
    .hand-queue-enter { animation: fadeSlideDown 0.2s ease-out forwards; }
`;

function GlobalStyles() {
    return <style>{GLOBAL_STYLES}</style>;
}

// ─── Emoji Reactions Overlay ──────────────────────────────────────────────────

function EmojiReactionsOverlay({ reactions }: { reactions: EmojiReaction[] }) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
            {reactions.map((r) => (
                <div
                    key={r.id}
                    className="emoji-reaction absolute bottom-20 flex flex-col items-center gap-1"
                    style={{ left: `${r.x}%` }}
                >
                    <span className="text-4xl drop-shadow-lg">{r.emoji}</span>
                    <span className="text-[10px] text-white/80 font-medium bg-black/40 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        {r.senderName}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Hand Raise Toast ─────────────────────────────────────────────────────────

function HandRaiseToast({ name, onDismiss }: { name: string; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div className="hand-toast-enter flex items-center gap-2.5 bg-neutral-800/95 backdrop-blur-sm border border-yellow-500/30 rounded-xl px-3 py-2.5 shadow-xl max-w-[220px]">
            <span className="text-xl flex-shrink-0 hand-wave">✋</span>
            <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{name}</span>
                <span className="text-[10px] text-neutral-400">raised their hand</span>
            </div>
            <button
                onClick={onDismiss}
                className="ml-auto text-neutral-500 hover:text-neutral-300 flex-shrink-0 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

// ─── Hand Queue Panel (host only) ────────────────────────────────────────────

function HandQueuePanel({
    raisedHands,
    onDismissAll,
    onDismissOne,
}: {
    raisedHands: HandRaiseEntry[];
    onDismissAll: () => void;
    onDismissOne: (identity: string) => void;
}) {
    if (raisedHands.length === 0) return null;

    return (
        <div className="hand-queue-enter absolute top-[56px] right-4 z-40 w-56 bg-neutral-900/95 backdrop-blur-sm border border-neutral-700/60 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800">
                <div className="flex items-center gap-1.5">
                    <span className="text-base">✋</span>
                    <span className="text-xs font-semibold text-neutral-100">
                        Raised hands ({raisedHands.length})
                    </span>
                </div>
                <button
                    onClick={onDismissAll}
                    className="text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                    Clear all
                </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
                {raisedHands.map((entry) => (
                    <div
                        key={entry.identity}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-800/60 transition-colors"
                    >
                        <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarFallback className="text-[9px] bg-neutral-700 text-neutral-200">
                                {getInitials(entry.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-xs text-neutral-200 truncate">{entry.name}</span>
                        <button
                            onClick={() => onDismissOne(entry.identity)}
                            className="text-neutral-500 hover:text-neutral-300 transition-colors"
                            title="Lower hand"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Participant Tile ─────────────────────────────────────────────────────────

function ParticipantTileInner({
    participant,
    hasHandRaised,
}: {
    participant: Participant;
    hasHandRaised: boolean;
}) {
    const trackRef = useTrackRefContext();
    const isSpeaking = useIsSpeaking(participant);

    const hasVideo =
        isTrackReference(trackRef) &&
        trackRef.source === Track.Source.Camera &&
        !trackRef.publication.isMuted;

    const audioRef = makeTrackRef(participant, Track.Source.Microphone);
    const isRemote = !(participant instanceof LocalParticipant);

    return (
        <div
            className={`
                relative w-full h-full bg-neutral-900 rounded-xl overflow-hidden
                flex items-center justify-center transition-all duration-150
                ${isSpeaking && !hasHandRaised ? "ring-2 ring-green-400 ring-offset-1 ring-offset-neutral-950" : ""}
                ${hasHandRaised ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-neutral-950" : ""}
            `}
        >
            {hasVideo ? (
                <VideoTrack
                    trackRef={trackRef as TrackReference}
                    className="w-full h-full object-cover"
                />
            ) : (
                <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl bg-neutral-800 text-neutral-200">
                        {getInitials(participant.name ?? participant.identity)}
                    </AvatarFallback>
                </Avatar>
            )}

            {/* ✋ Hand raised badge */}
            {hasHandRaised && (
                <div className="pop-in absolute top-2 right-2 w-7 h-7 bg-yellow-400/90 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm leading-none">✋</span>
                </div>
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

            {isRemote && audioRef && <AudioTrack trackRef={audioRef} />}
        </div>
    );
}

// ─── Video Grid ───────────────────────────────────────────────────────────────

function VideoGrid({ raisedHands }: { raisedHands: HandRaiseEntry[] }) {
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

    const cameraTracks = allTracks.filter((t) => t.source === Track.Source.Camera);
    const raisedSet = new Set(raisedHands.map((h) => h.identity));

    const TileWrapper = ({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) => (
        <TrackRefContext.Provider value={trackRef}>
            <ParticipantContext.Provider value={trackRef.participant}>
                <ParticipantTileInner
                    participant={trackRef.participant}
                    hasHandRaised={raisedSet.has(trackRef.participant.identity)}
                />
            </ParticipantContext.Provider>
        </TrackRefContext.Provider>
    );

    if (screenShareTrack) {
        return (
            <div className="flex flex-1 gap-2 overflow-hidden">
                <div className="flex-1 rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center">
                    <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-contain" />
                </div>
                <div className="w-40 flex flex-col gap-2 overflow-y-auto">
                    {cameraTracks.map((trackRef, i) => (
                        <div key={`${trackRef.participant.identity}-${i}`} className="aspect-video rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                            <TileWrapper trackRef={trackRef} />
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
                {cameraTracks.map((trackRef, i) => (
                    <div key={`${trackRef.participant.identity}-${i}`} className="bg-neutral-900 rounded-xl overflow-hidden min-h-[200px]">
                        <TileWrapper trackRef={trackRef} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
    onClose, messages, onSendMessage,
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
                                    <div className={`max-w-[200px] px-3 py-2 rounded-xl text-sm break-words ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-neutral-800 text-neutral-100 rounded-bl-sm"}`}>
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

function ParticipantsPanel({
    onClose,
    raisedHands,
}: {
    onClose: () => void;
    raisedHands: HandRaiseEntry[];
}) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const remoteParticipants = participants.filter(p => p.identity !== localParticipant.identity);
    const totalCount = remoteParticipants.length + 1;
    const raisedSet = new Set(raisedHands.map((h) => h.identity));

    return (
        <div className="w-64 flex flex-col bg-neutral-900 border-l border-neutral-800 h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-100">Participants ({totalCount})</span>
                </div>
                <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <ScrollArea className="flex-1 px-3 py-2">
                <div className="space-y-1">
                    <ParticipantRow participant={localParticipant} isLocal hasHandRaised={raisedSet.has(localParticipant.identity)} />
                    {remoteParticipants.map((p) => (
                        <ParticipantRow key={p.identity} participant={p} hasHandRaised={raisedSet.has(p.identity)} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

function ParticipantRow({
    participant, isLocal, hasHandRaised,
}: {
    participant: Participant;
    isLocal?: boolean;
    hasHandRaised?: boolean;
}) {
    const isSpeaking = useIsSpeaking(participant);
    const micPub = participant.getTrackPublication(Track.Source.Microphone);
    const camPub = participant.getTrackPublication(Track.Source.Camera);

    return (
        <div className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors ${isSpeaking ? "bg-green-500/10" : "hover:bg-neutral-800"}`}>
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
                {hasHandRaised && <span className="text-sm leading-none">✋</span>}
                {micPub?.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                {camPub?.isMuted && <VideoOff className="w-3 h-3 text-neutral-500" />}
            </div>
        </div>
    );
}

// ─── Emoji Tray ───────────────────────────────────────────────────────────────

function EmojiTray({ onReact, onClose }: { onReact: (emoji: string) => void; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="emoji-tray-enter absolute bottom-[72px] left-1/2 -translate-x-1/2 z-40
                        flex items-center gap-1 bg-neutral-800/95 backdrop-blur-sm
                        border border-neutral-700/60 rounded-2xl px-3 py-2 shadow-2xl"
        >
            {REACTION_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => { onReact(emoji); onClose(); }}
                    className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl
                               hover:bg-neutral-700 hover:scale-125 active:scale-110
                               transition-all duration-100 ease-out"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}

// ─── Control Bar ──────────────────────────────────────────────────────────────

function ControlBar({
    isHost, onEndMeeting, onLeave,
    onToggleChat, onToggleParticipants,
    onReact, onToggleHandRaise,
    chatOpen, participantsOpen,
    participantCount, handRaised, raisedHandCount,
}: {
    isHost: boolean;
    onEndMeeting: () => void;
    onLeave: () => void;
    onToggleChat: () => void;
    onToggleParticipants: () => void;
    onReact: (emoji: string) => void;
    onToggleHandRaise: () => void;
    chatOpen: boolean;
    participantsOpen: boolean;
    participantCount: number;
    handRaised: boolean;
    raisedHandCount: number;
}) {
    const { localParticipant } = useLocalParticipant();
    const [micEnabled, setMicEnabled] = useState(true);
    const [camEnabled, setCamEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [emojiTrayOpen, setEmojiTrayOpen] = useState(false);
    const [waveKey, setWaveKey] = useState(0);

    useEffect(() => {
        const enableDevices = async () => {
            try {
                await localParticipant.setMicrophoneEnabled(true);
                await localParticipant.setCameraEnabled(true);
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

    function handleHandRaiseClick() {
        onToggleHandRaise();
        if (!handRaised) setWaveKey((k) => k + 1);
    }

    return (
        <div className="relative h-16 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between px-6 flex-shrink-0">
            <div className="text-sm text-neutral-400 hidden sm:block w-40">
                {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </div>

            <div className="flex items-center gap-2">
                {/* Mic */}
                <button onClick={toggleMic} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${micEnabled ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700" : "bg-red-500 text-white"}`}>
                    {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                {/* Cam */}
                <button onClick={toggleCam} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${camEnabled ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700" : "bg-red-500 text-white"}`}>
                    {camEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                {/* Screen share */}
                <button onClick={toggleScreenShare} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${screenSharing ? "bg-primary text-primary-foreground" : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"}`}>
                    <MonitorUp className="w-4 h-4" />
                </button>

                {/* ── Raise Hand ── */}
                <button
                    onClick={handleHandRaiseClick}
                    title={handRaised ? "Lower hand" : "Raise hand"}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                        ${handRaised
                            ? "bg-yellow-400 text-neutral-900 shadow-lg shadow-yellow-500/25 scale-105"
                            : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-yellow-300"
                        }`}
                >
                    <span key={waveKey} className={`text-base leading-none select-none ${waveKey > 0 ? "hand-wave" : ""}`}>
                        ✋
                    </span>
                    {/* Pulse ring when hand is raised */}
                    {handRaised && (
                        <span className="absolute inset-0 rounded-full animate-ping bg-yellow-400/25 pointer-events-none" />
                    )}
                </button>

                {/* Emoji reactions */}
                <button
                    onClick={() => setEmojiTrayOpen((v) => !v)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${emojiTrayOpen ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40" : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"}`}
                    title="Send reaction"
                >
                    <Smile className="w-4 h-4" />
                </button>

                {/* Leave */}
                <button onClick={onLeave} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all ml-2">
                    <PhoneOff className="w-4 h-4" />
                </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 w-40 justify-end">
                <button
                    onClick={onToggleParticipants}
                    className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${participantsOpen ? "bg-primary/20 text-primary" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
                >
                    <Users className="w-4 h-4" />
                    {raisedHandCount > 0 ? (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-[9px] text-neutral-900 flex items-center justify-center font-bold">
                            {raisedHandCount}
                        </span>
                    ) : (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                            {participantCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={onToggleChat}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${chatOpen ? "bg-primary/20 text-primary" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}
                >
                    <MessageSquare className="w-4 h-4" />
                </button>
                {isHost && (
                    <Button size="sm" variant="destructive" className="text-xs h-8 px-3" onClick={onEndMeeting}>
                        End
                    </Button>
                )}
            </div>

            {emojiTrayOpen && (
                <EmojiTray onReact={onReact} onClose={() => setEmojiTrayOpen(false)} />
            )}
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
    const [reactions, setReactions] = useState<EmojiReaction[]>([]);

    // ── Hand raise ────────────────────────────────────────────────────────────
    const [myHandRaised, setMyHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState<HandRaiseEntry[]>([]);
    const [handToasts, setHandToasts] = useState<{ id: string; name: string }[]>([]);

    // ── Chat ──────────────────────────────────────────────────────────────────
    const { message: lastMessage } = useDataChannel("chat");
    useEffect(() => {
        if (!lastMessage) return;
        try {
            const decoded = new TextDecoder().decode(lastMessage.payload);
            const parsed = JSON.parse(decoded) as ChatMessage;
            setChatMessages((prev) => {
                if (prev.some(m => m.id === parsed.id)) return prev;
                return [...prev, { ...parsed, timestamp: new Date(parsed.timestamp) }];
            });
        } catch { /* ignore */ }
    }, [lastMessage]);

    // ── System ────────────────────────────────────────────────────────────────
    const { message: dataMessage } = useDataChannel("system");
    useEffect(() => {
        if (!dataMessage) return;
        try {
            const decoded = new TextDecoder().decode(dataMessage.payload);
            const parsed = JSON.parse(decoded);
            if (parsed.type === "ROOM_ENDED") setRoomEnded(true);
        } catch { /* ignore */ }
    }, [dataMessage]);

    // ── Reactions ─────────────────────────────────────────────────────────────
    const spawnReaction = useCallback((emoji: string, senderName: string) => {
        const id = crypto.randomUUID();
        const x = 10 + Math.random() * 75;
        setReactions((prev) => [...prev, { id, emoji, senderName, x }]);
        setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), REACTION_LIFETIME_MS);
    }, []);

    const { message: reactionMessage } = useDataChannel("reactions");
    useEffect(() => {
        if (!reactionMessage) return;
        try {
            const decoded = new TextDecoder().decode(reactionMessage.payload);
            const parsed = JSON.parse(decoded) as { emoji: string; senderName: string };
            spawnReaction(parsed.emoji, parsed.senderName);
        } catch { /* ignore */ }
    }, [reactionMessage, spawnReaction]);

    // ── Hand channel ──────────────────────────────────────────────────────────
    const { message: handMessage } = useDataChannel("hand");
    useEffect(() => {
        if (!handMessage) return;
        try {
            const decoded = new TextDecoder().decode(handMessage.payload);
            const parsed = JSON.parse(decoded);

            if (parsed.type === "HAND_RAISE") {
                const entry: HandRaiseEntry = {
                    identity: parsed.identity,
                    name: parsed.name,
                    raisedAt: parsed.raisedAt,
                };
                setRaisedHands((prev) => {
                    if (prev.some((h) => h.identity === entry.identity)) return prev;
                    return [...prev, entry].sort((a, b) => a.raisedAt - b.raisedAt);
                });
                const toastId = crypto.randomUUID();
                setHandToasts((prev) => [...prev, { id: toastId, name: entry.name }]);
            } else if (parsed.type === "HAND_LOWER") {
                setRaisedHands((prev) => prev.filter((h) => h.identity !== parsed.identity));
            }
        } catch { /* ignore */ }
    }, [handMessage]);

    // ── Handlers ──────────────────────────────────────────────────────────────

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

    function handleReact(emoji: string) {
        const senderName = localParticipant.name ?? localParticipant.identity;
        const payload = new TextEncoder().encode(JSON.stringify({ emoji, senderName }));
        localParticipant.publishData(payload, { reliable: true, topic: "reactions" });
        spawnReaction(emoji, senderName);
    }

    function handleToggleHandRaise() {
        const name = localParticipant.name ?? localParticipant.identity;
        const identity = localParticipant.identity;

        if (myHandRaised) {
            // Lower
            const payload = new TextEncoder().encode(JSON.stringify({ type: "HAND_LOWER", identity }));
            localParticipant.publishData(payload, { reliable: true, topic: "hand" });
            setMyHandRaised(false);
            setRaisedHands((prev) => prev.filter((h) => h.identity !== identity));
        } else {
            // Raise
            const raisedAt = Date.now();
            const payload = new TextEncoder().encode(JSON.stringify({ type: "HAND_RAISE", identity, name, raisedAt }));
            localParticipant.publishData(payload, { reliable: true, topic: "hand" });
            setMyHandRaised(true);
            setRaisedHands((prev) => {
                if (prev.some((h) => h.identity === identity)) return prev;
                return [...prev, { identity, name, raisedAt }].sort((a, b) => a.raisedAt - b.raisedAt);
            });
            // Show "You raised your hand" toast to self
            const toastId = crypto.randomUUID();
            setHandToasts((prev) => [...prev, { id: toastId, name: "You" }]);
        }
    }

    function handleDismissHandOne(identity: string) {
        setRaisedHands((prev) => prev.filter((h) => h.identity !== identity));
        if (identity === localParticipant.identity) setMyHandRaised(false);
    }
    function handleDismissAllHands() {
        setRaisedHands([]);
        setMyHandRaised(false);
    }

    async function handleEndMeeting() {
        const msg = new TextEncoder().encode(JSON.stringify({ type: "ROOM_ENDED" }));
        localParticipant.publishData(msg, { reliable: true, topic: "system" });
        try { await axios.delete(`/api/organizations/${orgId}/meetings/${roomId}`); } catch { /* ignore */ }
        room.disconnect();
        onLeave();
    }

    const participantCount = participants.filter(p => p.identity !== localParticipant.identity).length + 1;

    return (
        <div className="relative flex flex-col h-full bg-neutral-950">
            <GlobalStyles />

            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 border-b border-neutral-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1.5 text-xs border-green-500/40 text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                    </Badge>
                    <span className="text-sm font-medium text-neutral-200">{roomName}</span>
                </div>

                {/* Raised hands summary chip in header — visible to everyone */}
                {raisedHands.length > 0 && (
                    <button
                        onClick={() => { setParticipantsOpen(true); setChatOpen(false); }}
                        className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs px-3 py-1 rounded-full hover:bg-yellow-400/20 transition-colors"
                    >
                        <span className="text-sm">✋</span>
                        {raisedHands.length} raised {raisedHands.length === 1 ? "hand" : "hands"}
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                <div className="relative flex flex-col flex-1 p-3 gap-3 overflow-hidden">
                    {/* Emoji reactions overlay */}
                    <EmojiReactionsOverlay reactions={reactions} />

                    {/* Hand raise toasts — top-right corner */}
                    <div className="absolute top-3 right-3 z-40 flex flex-col gap-2 items-end pointer-events-none">
                        {handToasts.map((t) => (
                            <div key={t.id} className="pointer-events-auto">
                                <HandRaiseToast
                                    name={t.name}
                                    onDismiss={() => setHandToasts((prev) => prev.filter((x) => x.id !== t.id))}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Hand queue dropdown (host only, visible when participants panel open) */}
                    {isHost && participantsOpen && (
                        <HandQueuePanel
                            raisedHands={raisedHands}
                            onDismissAll={handleDismissAllHands}
                            onDismissOne={handleDismissHandOne}
                        />
                    )}

                    <VideoGrid raisedHands={raisedHands} />

                    <ControlBar
                        isHost={isHost}
                        onEndMeeting={handleEndMeeting}
                        onLeave={() => { room.disconnect(); onLeave(); }}
                        onToggleChat={() => { setChatOpen(!chatOpen); setParticipantsOpen(false); }}
                        onToggleParticipants={() => { setParticipantsOpen(!participantsOpen); setChatOpen(false); }}
                        onReact={handleReact}
                        onToggleHandRaise={handleToggleHandRaise}
                        chatOpen={chatOpen}
                        participantsOpen={participantsOpen}
                        participantCount={participantCount}
                        handRaised={myHandRaised}
                        raisedHandCount={raisedHands.length}
                    />
                </div>

                {chatOpen && (
                    <ChatPanel
                        onClose={() => setChatOpen(false)}
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                    />
                )}
                {participantsOpen && (
                    <ParticipantsPanel
                        onClose={() => setParticipantsOpen(false)}
                        raisedHands={raisedHands}
                    />
                )}
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