'use client'

import { cn } from '@/core/utils/utils'

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#64748b', '#10b981',
]

interface ColorPickerProps {
    value: string
    onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
                <button
                    key={c}
                    type="button"
                    onClick={() => onChange(c)}
                    className={cn(
                        'h-4 w-4 rounded-full transition-all ring-offset-background',
                        value === c
                            ? 'ring-2 ring-ring ring-offset-1 scale-110'
                            : 'hover:scale-110 opacity-80 hover:opacity-100'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                />
            ))}
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 rounded-full cursor-pointer border-0 bg-transparent p-0 opacity-80 hover:opacity-100"
                title="Custom color"
            />
        </div>
    )
}