'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,

} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import { Label } from '@/core/components/ui/label'
import { useRenameBoard } from '../hooks/useRenameBoard'

interface RenameBoardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    projectId: string
    boardId: string
    currentName: string
    onRenamed: (boardId: string, newName: string) => void
}

export function RenameBoardDialog({
    open,
    onOpenChange,
    orgId,
    projectId,
    boardId,
    currentName,
    onRenamed,
}: RenameBoardDialogProps) {
    const [name, setName] = useState(currentName)
    const { isRenaming, error, renameBoard } = useRenameBoard()
    const inputRef = useRef<HTMLInputElement>(null)

    // Reset name and focus input when dialog opens
    useEffect(() => {
        if (open) {
            setName(currentName)
            setTimeout(() => {
                inputRef.current?.select()
            }, 50)
        }
    }, [open, currentName])

    const trimmed = name.trim()
    const isUnchanged = trimmed === currentName.trim()
    const isDisabled = isRenaming || !trimmed || isUnchanged

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (isDisabled) return
        const success = await renameBoard(orgId, projectId, boardId, trimmed)
        if (success) {
            onRenamed(boardId, trimmed)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Rename board</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="board-name" className="text-sm">
                            Board name
                        </Label>
                        <Input
                            id="board-name"
                            ref={inputRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter board name"
                            disabled={isRenaming}
                            className="h-8 text-sm"
                            maxLength={100}
                            autoComplete="off"
                        />
                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isRenaming}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isDisabled}
                        >
                            {isRenaming ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    Rename Board
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}