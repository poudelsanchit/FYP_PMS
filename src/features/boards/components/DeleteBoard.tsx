'use client'

import { Loader2, AlertTriangle } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/core/components/ui/alert-dialog'
import { useDeleteBoard } from '../hooks/useDeleteBoard'

interface DeleteBoardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    projectId: string
    boardId: string
    boardName: string
    onDeleted: (boardId: string) => void
}

export function DeleteBoardDialog({
    open,
    onOpenChange,
    orgId,
    projectId,
    boardId,
    boardName,
    onDeleted,
}: DeleteBoardDialogProps) {
    const { isDeleting, error, deleteBoard } = useDeleteBoard()

    async function handleConfirm() {
        const success = await deleteBoard(orgId, projectId, boardId)
        if (success) {
            onDeleted(boardId)
            onOpenChange(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        Delete board
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete{' '}
                        <span className="font-medium text-foreground">"{boardName}"</span>?
                        This will permanently remove all columns and cards. This action
                        cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {error && (
                    <p className="text-xs text-destructive px-1">{error}</p>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Deleting…
                            </>
                        ) : (
                            'Delete board'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}