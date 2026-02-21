"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderKanban, Loader2, Plus, Sparkles } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { cn } from "@/core/utils/utils";
import { ColorPicker } from "@/core/components/ui/color-picker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string | undefined;
    onSuccess?: (project: CreatedProject) => void;
}

interface CreatedProject {
    id: string;
    name: string;
    key: string;
    description?: string | null;
    color: string;
    organizationId: string;
    createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_COLOR = "#3b82f6";
const KEY_REGEX = /^[A-Z0-9]{2,10}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateKey(name: string): string {
    const words = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .trim()
        .split(/\s+/);
    const acronym = words.map((w) => w[0] ?? "").join("");
    if (acronym.length >= 2) return acronym.slice(0, 10);
    return name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateProject({
    open,
    onOpenChange,
    orgId,
    onSuccess,
}: CreateProjectDialogProps) {
    const [name, setName] = useState("");
    const [key, setKey] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(DEFAULT_COLOR);
    const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!keyManuallyEdited && name) {
            setKey(generateKey(name));
        }
    }, [name, keyManuallyEdited]);

    const resetForm = useCallback(() => {
        setName("");
        setKey("");
        setDescription("");
        setColor(DEFAULT_COLOR);
        setKeyManuallyEdited(false);
        setErrors({});
    }, []);

    const handleOpenChange = (val: boolean) => {
        if (!val) resetForm();
        onOpenChange(val);
    };

    const validate = (): boolean => {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Project name is required.";
        if (!KEY_REGEX.test(key)) next.key = "2–10 uppercase letters or numbers.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleKeyChange = (val: string) => {
        setKeyManuallyEdited(true);
        setKey(val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/organizations/${orgId}/projects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    key,
                    description: description.trim() || undefined,
                    color,
                }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                setErrors({ form: json.error ?? "Something went wrong." });
                return;
            }

            onSuccess?.(json.data);
            handleOpenChange(false);
        } catch {
            setErrors({ form: "Network error. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">


                {/* Header */}
                <div className="px-5 pt-5 pb-4">
                    <DialogHeader className="gap-0">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="flex items-center justify-center h-7 w-7 rounded-md transition-colors duration-200 shrink-0"
                                style={{ backgroundColor: `${color}18` }}
                            >
                                <FolderKanban
                                    className="h-3.5 w-3.5 transition-colors duration-200"
                                    style={{ color }}
                                />
                            </div>
                            <DialogTitle className="text-base font-semibold">
                                Create project
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            Projects help you organize work, track issues, and collaborate with your team.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mx-5" />

                {/* Form */}
                <form id="create-project-form" onSubmit={handleSubmit}>
                    <div className="px-5 py-4 space-y-4">

                        {/* Global error */}
                        {errors.form && (
                            <div className="text-xs text-destructive bg-destructive/8 border border-destructive/20 px-3 py-2 rounded-md">
                                {errors.form}
                            </div>
                        )}

                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="project-name" className="text-xs font-medium">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="project-name"
                                placeholder="e.g. Marketing Website"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={cn(
                                    "h-8 text-sm",
                                    errors.name && "border-destructive focus-visible:ring-destructive"
                                )}
                                autoFocus
                                disabled={isLoading}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive">{errors.name}</p>
                            )}
                        </div>

                        {/* Identifier */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="project-key" className="text-xs font-medium">
                                    Identifier <span className="text-destructive">*</span>
                                </Label>
                                {!keyManuallyEdited && key && (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Sparkles className="h-2.5 w-2.5" />
                                        Auto-generated
                                    </span>
                                )}
                            </div>
                            <Input
                                id="project-key"
                                placeholder="MKTG"
                                value={key}
                                onChange={(e) => handleKeyChange(e.target.value)}
                                className={cn(
                                    "h-8 text-sm font-mono",
                                    errors.key && "border-destructive focus-visible:ring-destructive"
                                )}
                                maxLength={10}
                                disabled={isLoading}
                            />
                            {errors.key ? (
                                <p className="text-xs text-destructive">{errors.key}</p>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">
                                    Used as a prefix for all issues in this project.
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="project-desc" className="text-xs font-medium">
                                Description{" "}
                                <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                id="project-desc"
                                placeholder="What is this project about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="resize-none text-sm"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Color</Label>
                            <ColorPicker
                                value={color}
                                onChange={setColor}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="h-px bg-border mx-5" />
                    <div className="px-5 py-3.5 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                            className="h-8 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading}
                            className="h-8 text-xs min-w-[100px] text-white transition-colors duration-200"
                            style={{ backgroundColor: color }}
                        >
                            {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <> Create project <Plus /></>
                            )}
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}