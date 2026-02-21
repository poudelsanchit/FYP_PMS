"use client";

import * as React from "react";
import { HexColorPicker } from "react-colorful";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/core/components/ui/popover";
import { Input } from "@/core/components/ui/input";
import { cn } from "@/core/utils/utils";

const PRESET_COLORS = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#f97316", // orange
    "#6b7280", // gray
    "#000000", // black
];

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    className?: string;
    disabled?: boolean;
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
    ({ value, onChange, className, disabled }, ref) => {
        const [open, setOpen] = React.useState(false);
        const [hexInput, setHexInput] = React.useState(value.toUpperCase());

        // Keep hex input in sync when value changes externally
        React.useEffect(() => {
            setHexInput(value.toUpperCase());
        }, [value]);

        const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            setHexInput(raw);
            const normalized = raw.startsWith("#") ? raw : `#${raw}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
                onChange(normalized);
            }
        };

        return (
            <div ref={ref} className={cn("flex items-center gap-2.5", className)}>
                <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            disabled={disabled}
                            className={cn(
                                "h-8 w-8 rounded-md border border-input transition-all shrink-0",
                                "hover:ring-2 hover:ring-offset-1 hover:ring-border",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                open && "ring-2 ring-offset-1 ring-border"
                            )}
                            style={{ backgroundColor: value }}
                            aria-label="Open color picker"
                        />
                    </PopoverTrigger>

                    <PopoverContent
                        className="w-64 p-3 space-y-3"
                        align="start"
                        sideOffset={6}
                    >
                        {/* Spectrum picker */}
                        <div
                            className="[&_.react-colorful]:w-full [&_.react-colorful]:h-36
                                       [&_.react-colorful\_\_saturation]:rounded-md
                                       [&_.react-colorful\_\_hue]:rounded-full [&_.react-colorful\_\_hue]:mt-2.5 [&_.react-colorful\_\_hue]:h-2.5
                                       [&_.react-colorful\_\_pointer]:h-4 [&_.react-colorful\_\_pointer]:w-4
                                       [&_.react-colorful\_\_pointer]:border-2 [&_.react-colorful\_\_pointer]:border-white
                                       [&_.react-colorful\_\_pointer]:shadow-sm"
                        >
                            <HexColorPicker color={value} onChange={onChange} />
                        </div>

                        {/* Presets */}
                        <div className="grid grid-cols-6 gap-1.5">
                            {PRESET_COLORS.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => {
                                        onChange(preset);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        "h-7 w-full rounded-md border border-transparent transition-all hover:scale-105",
                                        value.toLowerCase() === preset.toLowerCase()
                                            ? "ring-2 ring-offset-1 ring-foreground/50 scale-105"
                                            : "border-input/40 hover:border-input"
                                    )}
                                    style={{ backgroundColor: preset }}
                                    aria-label={`Select ${preset}`}
                                />
                            ))}
                        </div>

                        {/* Hex input */}
                        <div className="flex items-center gap-2 pt-0.5">
                            <div
                                className="h-5 w-5 rounded shrink-0 border border-input"
                                style={{ backgroundColor: value }}
                            />
                            <Input
                                value={hexInput}
                                onChange={handleHexInput}
                                placeholder="#000000"
                                className="font-mono text-xs h-8 flex-1"
                                maxLength={7}
                                spellCheck={false}
                            />
                        </div>
                    </PopoverContent>
                </Popover>

                <span className="text-xs font-mono text-muted-foreground select-none">
                    {value.toUpperCase()}
                </span>
            </div>
        );
    }
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };