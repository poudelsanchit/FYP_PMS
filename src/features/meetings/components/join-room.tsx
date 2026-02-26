// src/features/meetings/components/JoinRoomDialog.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import { Lock, Users, Eye, EyeOff } from "lucide-react";
import { MeetingRoom } from "@/features/meetings/types/meeting.types";

interface Props {
    room: MeetingRoom | null;
    onClose: () => void;
    onJoin: (roomId: string, password: string) => Promise<void>;
}

export function JoinRoomDialog({ room, onClose, onJoin }: Props) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (room) {
            setPassword("");
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [room]);

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault();
        if (!room || !password.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            await onJoin(room.id, password);
            setPassword("");
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            setError(msg || "Incorrect password");
            setPassword("");
            setTimeout(() => inputRef.current?.focus(), 50);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={!!room} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="flex flex-col items-center text-center gap-3 pb-2">
                        {/* Lock icon with pulse ring */}
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div>
                            <DialogTitle className="text-lg">{room?.name}</DialogTitle>
                            <DialogDescription className="mt-1">
                                {room?.description || "Enter the room password to join this meeting"}
                            </DialogDescription>
                        </div>

                        {/* Room meta */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                <span>{room?.participantCount ?? 0} inside</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${room?.isActive ? "bg-green-500" : "bg-muted-foreground"}`} />
                                <span>{room?.isActive ? "Active" : "Closed"}</span>
                            </div>
                            <span>by {room?.createdBy.name ?? room?.createdBy.email}</span>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleJoin} className="space-y-3">
                    <div className="relative">
                        <Input
                            ref={inputRef}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter room password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`pr-10 text-center tracking-widest text-base ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            required
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive text-center font-medium animate-in fade-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoading || !password.trim() || !room?.isActive}
                        >
                            {isLoading ? "Joining..." : "Join Room"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}