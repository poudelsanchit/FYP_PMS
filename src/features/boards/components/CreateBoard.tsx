'use client'

import { useState, useCallback } from 'react'
import { LayoutGrid } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { Input } from '@/core/components/ui/input'
import type { Board } from '../hooks/useBoards'

interface CreateBoardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    projectId: string
    projectName: string
    onSuccess?: (board: Board) => void
}

export function CreateBoard({
    open,
    onOpenChange,
    orgId,
    projectId,
    projectName,
    onSuccess,
}: CreateBoardProps) {
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const resetForm = useCallback(() => {
        setName('')
        setError(null)
    }, [])

    const handleOpenChange = (val: boolean) => {
        if (!val) resetForm()
        onOpenChange(val)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) {
            setError('Board name is required.')
            return
        }
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/organizations/${orgId}/projects/${projectId}/boards`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), type: 'KANBAN' }),
                }
            )
            const json = await res.json()
            if (!res.ok || !json.success) {
                setError(json.error ?? 'Something went wrong.')
                return
            }
            onSuccess?.(json.data)
            handleOpenChange(false)
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="w-full max-w-[680px] rounded-xl border p-8 shadow-2xl">
                {/* Header */}
                <DialogHeader className="mb-2">
                    <div className="flex items-center gap-2 ">
                        <LayoutGrid className="w-5 h-5 " strokeWidth={1.8} />
                        <DialogTitle className="text-[1.15rem] font-semibold  leading-none">
                            Create a new board
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-[1rem]  mt-1 ">
                        Add a new board to {projectName}.
                    </DialogDescription>
                </DialogHeader>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Input */}
                    <Input
                        id="board-name"
                        placeholder="Enter page title"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        disabled={isLoading}
                        className="h-12 px-4 text-sm rounded-lg border focus-visible:ring-1 transition-colors" />

                    {error && (
                        <p className="text-xs text-red-400 -mt-3">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                            className="h-10 px-5 text-sm font-medium  bg-transparent border transition-colors">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="h-10 px-5 text-sm font-medium disabled:opacity-40 transition-colors"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Creating…
                                </span>
                            ) : (
                                'Create Space'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}