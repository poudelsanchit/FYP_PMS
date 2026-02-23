'use client'

import { useState } from 'react'
import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { Input } from '@/core/components/ui/input'
import { Button } from '@/core/components/ui/button'
import { ColorPicker } from './ColorPicker'

interface EditableItemProps {
    id: string
    name: string
    color: string
    onUpdate: (id: string, name: string, color: string) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

export function EditableItem({ id, name, color, onUpdate, onDelete }: EditableItemProps) {
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState(name)
    const [editColor, setEditColor] = useState(color)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleSave = async () => {
        if (!editName.trim()) return
        setSaving(true)
        try {
            await onUpdate(id, editName.trim(), editColor)
            setEditing(false)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try { await onDelete(id) }
        finally { setDeleting(false) }
    }

    const handleCancel = () => {
        setEditName(name)
        setEditColor(color)
        setEditing(false)
    }

    if (editing) {
        return (
            <div className="rounded-md border bg-muted/30 p-2.5 space-y-2.5">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: editColor }} />
                    <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-xs"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave()
                            if (e.key === 'Escape') handleCancel()
                        }}
                    />
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={handleSave}
                            disabled={!editName.trim() || saving}
                        >
                            {saving
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Check className="h-3 w-3" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={handleCancel}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
        )
    }

    return (
        <div className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs flex-1 truncate">{name}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setEditing(true)}
                >
                    <Pencil className="h-3 w-3" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 hover:text-destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    {deleting
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Trash2 className="h-3 w-3" />}
                </Button>
            </div>
        </div>
    )
}