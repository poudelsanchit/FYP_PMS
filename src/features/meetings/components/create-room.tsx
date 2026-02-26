// src/features/meetings/components/CreateRoomDialog.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Button } from "@/core/components/ui/button";
import { Textarea } from "@/core/components/ui/textarea";
import { Eye, EyeOff, Video } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; description?: string; password: string; scheduledAt?: string }) => Promise<void>;
}

export function CreateRoomDialog({ open, onClose, onCreate }: Props) {
    const [form, setForm] = useState({ name: "", description: "", password: "", scheduledAt: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim() || !form.password.trim()) {
            toast.error("Room name and password are required.");
            return;
        }
        setIsLoading(true);
        try {
            await onCreate({
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                password: form.password,
                scheduledAt: form.scheduledAt || undefined,
            });
            setForm({ name: "", description: "", password: "", scheduledAt: "" });
            toast.success("Meeting room created successfully!");
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(msg || "Failed to create room");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Video className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>New Meeting Room</DialogTitle>
                            <DialogDescription className="text-xs mt-0.5">
                                Only org admins and project leads can create rooms
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Room Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            placeholder="e.g. Sprint Planning"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="What's this meeting about? (optional)"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password">Room Password <span className="text-destructive">*</span></Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 4 characters"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                minLength={4}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Share this password with people you want to invite
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="scheduledAt">Schedule For (optional)</Label>
                        <Input
                            id="scheduledAt"
                            type="datetime-local"
                            value={form.scheduledAt}
                            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Room"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}