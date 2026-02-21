'use client'

import { useState, useMemo } from 'react'
import { Loader2, UserX, Clock, X, Users, UserPlus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import { Badge } from '@/core/components/ui/badge'
import { Separator } from '@/core/components/ui/separator'
import { useProjectMembers } from '../hooks/useProjectMembers'
import { MemberMultiSelect } from './MemberMultiSelect'
import RemoveMemberDialog from './RemoveMember'
import type { ProjectMember } from '../hooks/useProjectMembers'

interface ProjectMembersDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    project: { id: string; name: string; userIsLead?: boolean } | null
    isAdmin: boolean
    userProjectRole?: 'PROJECT_LEAD' | 'PROJECT_MEMBER'
}

const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    return email[0].toUpperCase()
}

const ProjectMembersDialog = ({
    open,
    onOpenChange,
    orgId,
    project,
    isAdmin,
    userProjectRole,
}: ProjectMembersDialogProps) => {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [inviteSuccess, setInviteSuccess] = useState(false)
    // Inside the component, add state for the removal target
    const [removeTarget, setRemoveTarget] = useState<ProjectMember | null>(null)


    const {
        members,
        pendingInvites,
        isLoading,
        isInviting,
        error,
        inviteMembers,
        removeMember,
        cancelInvite,
    } = useProjectMembers(orgId, open ? project?.id ?? null : null, isAdmin || userProjectRole === 'PROJECT_LEAD')

    // Determine if user can manage members (admin, org admin, or project lead)
    const canManage = isAdmin || userProjectRole === 'PROJECT_LEAD'

    // Get list of user IDs to exclude from selection
    const excludeUserIds = useMemo(() => {
        const memberUserIds = members.map(m => m.user.id)
        const invitedUserIds = pendingInvites.map(i => i.userId)
        return [...memberUserIds, ...invitedUserIds]
    }, [members, pendingInvites])

    const handleInvite = async () => {
        if (selectedUserIds.length === 0) return
        const success = await inviteMembers(selectedUserIds)
        if (success) {
            setSelectedUserIds([])
            setInviteSuccess(true)
            setTimeout(() => setInviteSuccess(false), 3000)
        }
    }

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) setSelectedUserIds([])
        onOpenChange(isOpen)
    }

    const handleRemoveMember = async (memberId: string): Promise<boolean> => {
        return await removeMember(memberId)
    }
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {project?.name} — Members
                    </DialogTitle>
                    <DialogDescription>
                        Manage who has access to this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-0 overflow-hidden flex-1">
                    {/* Invite section - admin or project lead only */}
                    {canManage && (
                        <div className="px-6 pb-4 flex flex-col gap-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Invite members
                            </p>
                            <MemberMultiSelect
                                orgId={orgId}
                                selectedUserIds={selectedUserIds}
                                onSelectionChange={setSelectedUserIds}
                                excludeUserIds={excludeUserIds}
                                disabled={isInviting}
                            />
                            <div className="flex items-center justify-end">
                                <Button
                                    size="sm"
                                    onClick={handleInvite}
                                    disabled={selectedUserIds.length === 0 || isInviting}
                                    className="shrink-0"
                                >
                                    {isInviting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <UserPlus className="h-3.5 w-3.5" />
                                    )}
                                    {isInviting
                                        ? 'Inviting...'
                                        : `Invite${selectedUserIds.length > 1 ? ` (${selectedUserIds.length})` : ''}`
                                    }
                                </Button>
                            </div>
                            {inviteSuccess && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {selectedUserIds.length > 1 ? 'Invites' : 'Invite'} sent successfully!
                                </p>
                            )}
                            {error && (
                                <p className="text-xs text-destructive">{error}</p>
                            )}
                        </div>
                    )}

                    <Separator />

                    <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
                                {/* Pending Invites */}
                                {pendingInvites.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Pending invites
                                            </p>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                                                {pendingInvites.length}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            {pendingInvites.map((invite) => (
                                                <div
                                                    key={invite.id}
                                                    className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/40 group"
                                                >
                                                    <div className="h-7 w-7 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                                                        <Clock className="h-3 w-3 text-muted-foreground/50" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm truncate text-muted-foreground">
                                                            {invite.user.name || invite.user.email}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground/60">
                                                            Invited {new Date(invite.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {canManage && (
                                                        <button
                                                            onClick={() => cancelInvite(invite.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive rounded"
                                                            aria-label="Cancel invite"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Members */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Members
                                        </p>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                                            {members.length}
                                        </Badge>
                                    </div>

                                    {members.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No members yet
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            {members.map((member) => (
                                                <div
                                                    key={member.id}
                                                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 group transition-all"
                                                >
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarImage src={member.user.avatar ?? undefined} />
                                                        <AvatarFallback className="text-[11px]">
                                                            {getInitials(member.user.name, member.user.email)}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        {member.user.name && (
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className="text-sm font-medium truncate leading-none">
                                                                    {member.user.name}
                                                                </p>
                                                                <Badge
                                                                    variant={member.role === 'PROJECT_LEAD' ? 'default' : 'secondary'}
                                                                    className="text-[10px] px-1.5 h-4 shrink-0"
                                                                >
                                                                    {member.role === 'PROJECT_LEAD' ? 'Lead' : 'Member'}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {member.user.email}
                                                        </p>
                                                    </div>

                                                    {canManage && member.role !== 'PROJECT_LEAD' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setRemoveTarget(member)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1"
                                                        >
                                                            <UserX className="h-3.5 w-3.5 mr-1" />
                                                            <span className="text-xs">Remove</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
            <RemoveMemberDialog
                open={!!removeTarget}
                onOpenChange={(open) => !open && setRemoveTarget(null)}
                member={removeTarget}
                onConfirm={handleRemoveMember}
            />
        </Dialog>
    )
}

export default ProjectMembersDialog