'use client'

import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, MoreHorizontal, Pencil, Trash2, X, Check, CheckCircle2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/core/components/ui/dropdown-menu'
import { IssueCard } from './IssueCard'
import { Column, Issue } from '../types/types'

interface KanbanColumnProps {
    column: Column
    issues: Issue[]
    canManage: boolean
    onIssueClick: (issue: Issue) => void
    onAddIssue: (columnId: string) => void
    onRename: (columnId: string, name: string) => void
    onDelete: (columnId: string) => void
    onToggleCompleted: (columnId: string, isCompleted: boolean) => void
    isOver?: boolean
}

export function KanbanColumn({
    column,
    issues,
    canManage,
    onIssueClick,
    onAddIssue,
    onRename,
    onDelete,
    onToggleCompleted,
}: KanbanColumnProps) {
    const [isRenaming, setIsRenaming] = useState(false)
    const [renameValue, setRenameValue] = useState(column.name)
    const renameInputRef = useRef<HTMLInputElement>(null)

    const { setNodeRef, isOver } = useDroppable({ id: column.id })

    const handleRenameConfirm = () => {
        if (renameValue.trim() && renameValue.trim() !== column.name) {
            onRename(column.id, renameValue.trim())
        }
        setIsRenaming(false)
    }

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameConfirm()
        if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(column.name) }
    }

    const startRename = () => {
        setRenameValue(column.name)
        setIsRenaming(true)
        setTimeout(() => renameInputRef.current?.select(), 50)
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-2 w-72 shrink-0 h-fit"
        >
            {/* Column Header */}
            <div className={[
                'flex items-center justify-between px-3 py-2.5 mb-2 border bg-card/80 backdrop-blur-sm transition-colors duration-150',
                isOver ? 'border-primary/40 bg-primary/5' : 'border-border/60',
            ].join(' ')}>
                {isRenaming ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-1">
                        <input
                            ref={renameInputRef}
                            autoFocus
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            className="flex-1 text-sm font-semibold bg-transparent outline-none border-b border-primary/60 pb-0.5 text-foreground"
                        />
                        <button onClick={handleRenameConfirm} className="p-0.5 hover:text-primary transition-colors">
                            <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { setIsRenaming(false); setRenameValue(column.name) }} className="p-0.5 hover:text-destructive transition-colors">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{column.name}</h3>
                        {column.isCompleted && (
                            <span title="Completed column">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                            </span>
                        )}
                        <span className="shrink-0 text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full leading-none">
                            {issues.length}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-0.5 shrink-0">
                    {canManage && !isRenaming && (
                        <>
                            <button
                                onClick={() => onAddIssue(column.id)}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Add issue"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Column options">
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="bottom" align="end" className="w-40">
                                    <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onSelect={startRename}>
                                        <Pencil className="h-3.5 w-3.5" />
                                        Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="gap-2 text-xs cursor-pointer" 
                                        onSelect={() => onToggleCompleted(column.id, !column.isCompleted)}
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {column.isCompleted ? 'Unmark as completed' : 'Set as completed column'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                        onSelect={() => onDelete(column.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete column
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>

            {/* Drop zone */}
            <div
                ref={setNodeRef}
                className={[
                    'flex flex-col gap-2  rounded-sm transition-all duration-150 ',
                    issues.length === 0 ? '' : 'min-h-[120px]',
                ].join(' ')} >
                <AnimatePresence mode="popLayout">
                    {issues.map(issue => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            onClick={() => onIssueClick(issue)}
                        />
                    ))}
                </AnimatePresence>

                {canManage && (
                    <button
                        onClick={() => onAddIssue(column.id)}
                        className={[
                            'flex cursor-pointer items-center gap-2 w-full px-3 py-2 rounded-none',
                            'text-xs text-muted-foreground/60 hover:text-muted-foreground',
                            'hover:bg-muted/60 border border-dashed border-transparent hover:border-border/60',
                            'transition-all duration-150 mt-auto',
                        ].join(' ')}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add issue
                    </button>
                )}
            </div>
        </motion.div >
    )
}
