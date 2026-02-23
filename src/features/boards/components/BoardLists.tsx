'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import {
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/core/components/ui/sidebar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu'
import type { Board } from '../hooks/useBoards'
import { DeleteBoardDialog } from './DeleteBoard'
import { RenameBoardDialog } from './RenameBoardDialog'

interface BoardsListProps {
    orgId: string
    projectId: string
    projectColor: string
    canCreate: boolean
    onCreateClick: () => void
    // Boards are now owned by the parent — no internal fetching
    boards: Board[]
    isLoading: boolean
    error: string | null
    onBoardRemoved: (boardId: string) => void
    onBoardRenamed: (boardId: string, newName: string) => void
}

export function BoardsList({
    orgId,
    projectId,
    projectColor,
    canCreate,
    onCreateClick,
    boards,
    isLoading,
    error,
    onBoardRemoved,
    onBoardRenamed,
}: BoardsListProps) {
    const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)
    const [renameTarget, setRenameTarget] = useState<Board | null>(null)

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50 shrink-0" />
                <span className="text-[11px] text-muted-foreground/50">Loading…</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5">
                <AlertCircle className="h-3 w-3 text-destructive/60 shrink-0" />
                <span className="text-[11px] text-muted-foreground/60">
                    Failed to load — retry from sidebar
                </span>
            </div>
        )
    }

    if (boards.length === 0) {
        return (
            <div className="px-2 py-0.5">
                <span className="text-[11px] text-muted-foreground/50 italic">
                    No boards yet
                </span>
            </div>
        )
    }

    return (
        <>
            {boards.map((board) => (
                <SidebarMenuSubItem key={board.id} className="group/board relative flex items-center">
                    <SidebarMenuSubButton asChild className="flex-1 pr-7">
                        <Link
                            href={`/app/${orgId}/${projectId}/${board.id}`}
                            className="flex items-center gap-2"
                        >
                            <span className="truncate">{board.name}</span>
                        </Link>
                    </SidebarMenuSubButton>

                    {canCreate && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={[
                                        'absolute right-1 top-1/2 -translate-y-1/2',
                                        'flex items-center justify-center',
                                        'h-5 w-5 rounded',
                                        'text-muted-foreground hover:text-foreground hover:bg-accent',
                                        // Hidden by default, visible only when this row is hovered or dropdown is open
                                        'opacity-0 group-hover/board:opacity-100 data-[state=open]:opacity-100',
                                        'transition-opacity',
                                    ].join(' ')}
                                    onClick={(e) => e.preventDefault()}
                                    aria-label="Board options"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start" className="w-40">
                                <DropdownMenuItem
                                    className="gap-2 text-xs cursor-pointer"
                                    onSelect={() => setRenameTarget(board)}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Rename board
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                    onSelect={() => setDeleteTarget(board)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete board
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </SidebarMenuSubItem>
            ))}

            {deleteTarget && (
                <DeleteBoardDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
                    orgId={orgId}
                    projectId={projectId}
                    boardId={deleteTarget.id}
                    boardName={deleteTarget.name}
                    onDeleted={onBoardRemoved}
                />
            )}

            {renameTarget && (
                <RenameBoardDialog
                    open={!!renameTarget}
                    onOpenChange={(open) => { if (!open) setRenameTarget(null) }}
                    orgId={orgId}
                    projectId={projectId}
                    boardId={renameTarget.id}
                    currentName={renameTarget.name}
                    onRenamed={onBoardRenamed}
                />
            )}
        </>
    )
}