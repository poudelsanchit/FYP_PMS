// components/RemoveMemberDialog.tsx
'use client'

import { useState } from 'react'
import { Loader2, UserX, AlertTriangle, ShieldAlert } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from '@/core/components/ui/alert-dialog'
import { Button } from '@/core/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import { Badge } from '@/core/components/ui/badge'
import type { ProjectMember } from '../hooks/useProjectMembers'

interface RemoveMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: ProjectMember | null
    onConfirm: (memberId: string) => Promise<boolean>
}

const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    return email[0].toUpperCase()
}

const RemoveMemberDialog = ({ open, onOpenChange, member, onConfirm }: RemoveMemberDialogProps) => {
    const [isRemoving, setIsRemoving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleConfirm = async () => {
        if (!member) return
        setIsRemoving(true)
        setError(null)
        
        const success = await onConfirm(member.id)
        setIsRemoving(false)
        
        if (success) {
            onOpenChange(false)
            // Reset error state when dialog closes
            setTimeout(() => setError(null), 300)
        } else {
            setError('Failed to remove member. Please try again.')
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isRemoving) {
            onOpenChange(isOpen)
            if (!isOpen) {
                // Reset error state when dialog closes
                setTimeout(() => setError(null), 300)
            }
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                            <AlertDialogTitle className="text-base">Remove member from project</AlertDialogTitle>
                        </div>
                    </div>
                    <AlertDialogDescription className="text-sm pt-2">
                        Are you sure you want to remove this member? They will immediately lose access to the project and all its resources.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {member && (
                    <div className="space-y-3 py-2">
                        <div className="flex items-center gap-3 py-3 px-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
                            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-destructive/20">
                                <AvatarImage src={member.user.avatar ?? undefined} />
                                <AvatarFallback className="text-xs bg-destructive/10">
                                    {getInitials(member.user.name, member.user.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                {member.user.name && (
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-semibold truncate">{member.user.name}</p>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                            {member.role === 'PROJECT_LEAD' ? 'Lead' : 'Member'}
                                        </Badge>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-1">
                                <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                                    This action cannot be undone
                                </p>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                    The member will need to be re-invited to regain access.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                <p className="text-xs text-destructive flex-1">{error}</p>
                            </div>
                        )}
                    </div>
                )}

                <AlertDialogFooter className="gap-2 sm:gap-2">
                    <AlertDialogCancel disabled={isRemoving} className="mt-0">
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isRemoving}
                        className="gap-2"
                    >
                        {isRemoving ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Removing...
                            </>
                        ) : (
                            <>
                                <UserX className="h-3.5 w-3.5" />
                                Remove member
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default RemoveMemberDialog