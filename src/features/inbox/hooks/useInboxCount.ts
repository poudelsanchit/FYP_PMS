import { useState, useEffect, useCallback } from 'react'
import { INBOX_REFRESH_EVENT } from './useInboxRefresh'

export const useInboxCount = (orgId?: string) => {
    const [count, setCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const fetchCount = useCallback(async () => {
        if (!orgId) {
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            const url = new URL('/api/user/invitations', window.location.origin)
            url.searchParams.set('orgId', orgId)
            
            const response = await fetch(url.toString())
            if (response.ok) {
                const data = await response.json()
                const orgCount = data.organizationInvitations?.length || 0
                const projectCount = data.projectInvitations?.length || 0
                setCount(orgCount + projectCount)
            }
        } catch (error) {
            console.error('Failed to fetch inbox count:', error)
        } finally {
            setIsLoading(false)
        }
    }, [orgId])

    useEffect(() => {
        fetchCount()

        // Listen for refresh events
        window.addEventListener(INBOX_REFRESH_EVENT, fetchCount)

        // Poll every 30 seconds for updates
        const interval = setInterval(fetchCount, 30000)
        
        return () => {
            window.removeEventListener(INBOX_REFRESH_EVENT, fetchCount)
            clearInterval(interval)
        }
    }, [fetchCount])

    return { count, isLoading }
}
