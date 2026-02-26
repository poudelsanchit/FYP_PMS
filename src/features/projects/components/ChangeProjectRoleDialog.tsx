'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group'
import { Label } from '@/core/components/ui/label'
import { Loader2, Shield, User, AlertCircle, Crown } from 'lucide-react'
import type { ProjectMember } from '../hooks/useProjectMembers'

interface ChangeProjectRoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: ProjectMember | null
    onConfirm: (memberId: string, newRole: 'PROJECT_LEAD' | 'PROJECT_MEMBER') => Promise<boolean>
}

export function ChangeProjectRoleDialog({
    open,
    onOpenChange,
    member,
    onConfirm,
}: ChangeProjectRoleDialogProps) {
    const [selectedRole, setSelectedRole] = useState<'PROJECT_LEAD' | 'PROJECT_MEMBER'>(
        member?.role ?? 'PROJECT_MEMBER'
    )
    const [isLoading, setIsLoading] = useState(false)

    // Update selected role when member changes
    useState(() => {
        if (member) {
            setSelectedRole(member.role)
        }
    })

    const handleConfirm = async () => {
        if (!member || selectedRole === member.role) {
            onOpenChange(false)
            return
        }

        setIsLoading(true)
        try {
            await onConfirm(member.id, selectedRole)
            onOpenChange(false)
        } catch (error) {
            console.error('Error changing role:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!member) return null

    const isRoleChanged = selectedRole !== member.role

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Change Member Role</DialogTitle>
                    <DialogDescription>
                        Update the role for {member.user.name || member.user.email}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Current member info */}
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                                {member.user.name?.charAt(0).toUpperCase() ||
                                    member.user.email.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                                {member.user.name || 'Anonymous User'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                                {member.user.email}
                            </p>
                        </div>
                    </div>

                    {/* Role selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Select new role</Label>
                        <RadioGroup
                            value={selectedRole}
                            onValueChange={(value: string) =>
                                setSelectedRole(value as 'PROJECT_LEAD' | 'PROJECT_MEMBER')
                            }
                        >
                            {/* Lead role */}
                            <div
                                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                    selectedRole === 'PROJECT_LEAD'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedRole('PROJECT_LEAD')}
                            >
                                <RadioGroupItem value="PROJECT_LEAD" id="lead" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                        <Label
                                            htmlFor="lead"
                                            className="font-semibold cursor-pointer"
                                        >
                                            Lead
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Can manage project members, settings, and has full access to all project features
                                    </p>
                                </div>
                            </div>

                            {/* Member role */}
                            <div
                                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                    selectedRole === 'PROJECT_MEMBER'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedRole('PROJECT_MEMBER')}
                            >
                                <RadioGroupItem value="PROJECT_MEMBER" id="member" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <Label
                                            htmlFor="member"
                                            className="font-semibold cursor-pointer"
                                        >
                                            Member
                                        </Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Can view and contribute to the project
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Warning for role change */}
                    {isRoleChanged && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                {selectedRole === 'PROJECT_LEAD'
                                    ? 'This member will gain full access to manage this project.'
                                    : 'This member will lose project management privileges and only have contributor access.'}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !isRoleChanged}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 mr-2" />
                                Update Role
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
