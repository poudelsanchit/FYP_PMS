"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderKanban, Loader2, Plus, Sparkles, Tag, Flag } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { Switch } from "@/core/components/ui/switch";
import { Separator } from "@/core/components/ui/separator";
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

const DEFAULT_LABELS = [
    { name: "Bug", color: "#ef4444" },
    { name: "Feature", color: "#3b82f6" },
    { name: "Improvement", color: "#8b5cf6" },
    { name: "Documentation", color: "#64748b" },
];

const DEFAULT_PRIORITIES = [
    { name: "Urgent", color: "#ef4444", order: 0 },
    { name: "High", color: "#f97316", order: 1 },
    { name: "Medium", color: "#eab308", order: 2 },
    { name: "Low", color: "#22c55e", order: 3 },
];

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

async function seedDefaults(
    orgId: string,
    projectId: string,
    includeLabels: boolean,
    includePriorities: boolean
) {
    const base = `/api/organizations/${orgId}/projects/${projectId}`;
    const tasks: Promise<unknown>[] = [];

    if (includeLabels) {
        DEFAULT_LABELS.forEach(({ name, color }) => {
            tasks.push(
                fetch(`${base}/labels`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, color }),
                })
            );
        });
    }

    if (includePriorities) {
        DEFAULT_PRIORITIES.forEach(({ name, color, order }) => {
            tasks.push(
                fetch(`${base}/priorities`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, color, order }),
                })
            );
        });
    }

    await Promise.allSettled(tasks);
}

// ─── Preview chip ─────────────────────────────────────────────────────────────

function PreviewChip({ color, name }: { color: string; name: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {name}
        </span>
    );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
    icon,
    label,
    description,
    checked,
    onCheckedChange,
    preview,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
    preview: { color: string; name: string }[];
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground">
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium leading-none">{label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>
                <Switch checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
            </div>
            <div className="flex flex-wrap gap-1 pl-8">
                {preview.map((p) => (
                    <PreviewChip key={p.name} color={p.color} name={p.name} />
                ))}
            </div>
        </div>
    );
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
    const [includeLabels, setIncludeLabels] = useState(true);
    const [includePriorities, setIncludePriorities] = useState(true);
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
        setIncludeLabels(true);
        setIncludePriorities(true);
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

            // Seed defaults in the background — non-blocking
            if (includeLabels || includePriorities) {
                seedDefaults(orgId!, json.data.id, includeLabels, includePriorities);
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
            <DialogContent className="w-full max-w-[680px] rounded-xl border p-8 shadow-2xl">

                {/* Header */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-2">
                        <FolderKanban className="w-5 h-5" strokeWidth={1.8} />
                        <DialogTitle className="text-[1.15rem] font-semibold leading-none">
                            Create a new project
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-[1rem] mt-1">
                        Projects help you organize work, track issues, and collaborate with your team.
                    </DialogDescription>
                </DialogHeader>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* Global error */}
                    {errors.form && (
                        <p className="text-xs text-red-400">{errors.form}</p>
                    )}

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="project-name" className="text-xs font-medium">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="project-name"
                            placeholder="e.g. Marketing Website"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={cn(
                                "h-12 px-4 text-sm rounded-lg border focus-visible:ring-1 transition-colors",
                                errors.name && "border-destructive focus-visible:ring-destructive"
                            )}
                            autoFocus
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-400">{errors.name}</p>
                        )}
                    </div>

                    {/* Identifier */}
                    <div className="flex flex-col gap-1.5">
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
                                "h-12 px-4 text-sm font-mono rounded-lg border focus-visible:ring-1 transition-colors",
                                errors.key && "border-destructive focus-visible:ring-destructive"
                            )}
                            maxLength={10}
                            disabled={isLoading}
                        />
                        {errors.key ? (
                            <p className="text-xs text-red-400">{errors.key}</p>
                        ) : (
                            <p className="text-[11px] text-muted-foreground">
                                Used as a prefix for all issues in this project.
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
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
                            className="resize-none dark:bg-background text-sm px-4 py-3 rounded-lg border focus-visible:ring-1 transition-colors"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Color */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-medium">Color</Label>
                        <ColorPicker
                            value={color}
                            onChange={setColor}
                            disabled={isLoading}
                        />
                    </div>

                    <Separator />

                    {/* Default setup */}
                    <div className="space-y-1.5">
                        <div className="space-y-3">
                            <ToggleRow
                                icon={<Tag className="h-3 w-3" />}
                                label="Default labels"
                                description="Bug, Feature, Improvement, Documentation"
                                checked={includeLabels}
                                onCheckedChange={setIncludeLabels}
                                preview={DEFAULT_LABELS}
                            />
                            <ToggleRow
                                icon={<Flag className="h-3 w-3" />}
                                label="Default priorities"
                                description="Urgent, High, Medium, Low"
                                checked={includePriorities}
                                onCheckedChange={setIncludePriorities}
                                preview={DEFAULT_PRIORITIES}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2.5 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                            className="h-10 px-5 text-sm font-medium bg-transparent border transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-10 px-5 text-sm font-medium disabled:opacity-40 transition-colors"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Creating…
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    Create project <Plus className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}