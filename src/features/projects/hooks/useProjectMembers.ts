import { useState, useEffect, useCallback } from 'react'

export interface ProjectMember {
    id: string
    role: 'PROJECT_LEAD' | 'PROJECT_MEMBER'
    user: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
}

export interface PendingInvite {
    id: string
    userId: string
    role: 'PROJECT_LEAD' | 'PROJECT_MEMBER'
    expiresAt: string
    createdAt: string
    user: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
}

export const useProjectMembers = (orgId: string, projectId: string | null, canManage: boolean = false) => {
    const [members, setMembers] = useState<ProjectMember[]>([])
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isInviting, setIsInviting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchMembers = useCallback(async () => {
        if (!projectId) return
        setIsLoading(true)
        setError(null)

        try {
            const membersRes = await fetch(`/api/organizations/${orgId}/projects/${projectId}/members`)
            const membersData = await membersRes.json()

            if (!membersRes.ok) throw new Error(membersData.error ?? 'Failed to fetch members')

            setMembers(membersData.data ?? [])

            // Only fetch invites if user can manage
            if (canManage) {
                const invitesRes = await fetch(`/api/organizations/${orgId}/projects/${projectId}/invitations?status=pending`)
                const invitesData = await invitesRes.json()

                if (invitesRes.ok) {
                    setPendingInvites(invitesData.data ?? [])
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }, [orgId, projectId, canManage])

    useEffect(() => {
        if (projectId) fetchMembers()
    }, [fetchMembers, projectId])

    const inviteMembers = useCallback(async (userIds: string[], role: 'PROJECT_LEAD' | 'PROJECT_MEMBER' = 'PROJECT_MEMBER'): Promise<boolean> => {
        if (!projectId || !canManage) return false
        setIsInviting(true)

        try {
            // Send invitations one by one
            const results = await Promise.all(
                userIds.map(userId =>
                    fetch(`/api/organizations/${orgId}/projects/${projectId}/invitations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, role }),
                    })
                )
            )

            const dataPromises = results.map(res => res.json())
            const allData = await Promise.all(dataPromises)

            // Check if any failed
            const failed = results.some(res => !res.ok)
            if (failed) {
                const firstError = allData.find(d => d.error)
                throw new Error(firstError?.error ?? 'Failed to send some invites')
            }

            // Refresh to get updated invites
            await fetchMembers()
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            return false
        } finally {
            setIsInviting(false)
        }
    }, [projectId, canManage, orgId, fetchMembers])

    const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
        if (!projectId || !canManage) return false

        try {
            const res = await fetch(
                `/api/organizations/${orgId}/projects/${projectId}/members/${memberId}`,
                { method: 'DELETE' }
            )

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Failed to remove member')

            setMembers((prev) => prev.filter((m) => m.id !== memberId))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            return false
        }
    }, [projectId, canManage, orgId])

    const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
        if (!projectId || !canManage) return false

        try {
            // Delete invitation via the invitations endpoint
            const res = await fetch(
                `/api/organizations/${orgId}/projects/${projectId}/invitations/${inviteId}`,
                { method: 'DELETE' }
            )

            const data = await res.json()
            if (!res.ok) throw new Error(data.error ?? 'Failed to cancel invite')

            setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            return false
        }
    }, [projectId, canManage, orgId])

    return {
        members,
        pendingInvites,
        isLoading,
        isInviting,
        error,
        inviteMembers,
        removeMember,
        cancelInvite,
        refetch: fetchMembers,
        canManage,
    }
}