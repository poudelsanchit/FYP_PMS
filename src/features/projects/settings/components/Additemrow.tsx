'use client'

import { useState } from 'react'
import { Check, Loader2, Plus, X } from 'lucide-react'
import { Input } from '@/core/components/ui/input'
import { Button } from '@/core/components/ui/button'
import { ColorPicker } from './ColorPicker'

interface AddItemRowProps {
    placeholder: string
    onAdd: (name: string, color: string) => Promise<void>
}

export function AddItemRow({ placeholder, onAdd }: AddItemRowProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [color, setColor] = useState('#3b82f6')
    const [loading, setLoading] = useState(false)

    const handleAdd = async () => {
        if (!name.trim()) return
        setLoading(true)
        try {
            await onAdd(name.trim(), color)
            setName('')
            setColor('#3b82f6')
            setOpen(false)
        } finally {
            setLoading(false)
        }
    }

    if (!open) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                onClick={() => setOpen(true)}
            >
                <Plus className="h-3.5 w-3.5" />
                Add {placeholder.toLowerCase()}
            </Button>
        )
    }

    return (
        <div className="rounded-md border bg-muted/30 p-2.5 space-y-2.5">
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <Input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={placeholder}
                    className="h-7 text-xs"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                        if (e.key === 'Escape') setOpen(false)
                    }}
                />
                <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleAdd}
                        disabled={!name.trim() || loading}
                    >
                        {loading
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Check className="h-3 w-3" />}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <ColorPicker value={color} onChange={setColor} />
        </div>
    )
}