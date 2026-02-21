import { useState, useEffect, useCallback } from 'react'

export interface OrgMember {
    id: string
    userId: string
    role: 'ORG_ADMIN' | 'ORG_MEMBER'
    user: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
}

export const useOrgMembers = (orgId: string, search?: string) => {
    const [members, setMembers] = useState<OrgMember[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchMembers = useCallback(async (page = 1, append = false) => {
        if (append) {
            setIsLoadingMore(true)
        } else {
            setIsLoading(true)
        }
        setError(null)

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(search && { search }),
            })

            const res = await fetch(`/api/organizations/${orgId}/members?${params}`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error ?? 'Failed to fetch members')

            if (append) {
                setMembers(prev => [...prev, ...(data.members ?? [])])
            } else {
                setMembers(data.members ?? [])
            }
            setPagination(data.pagination)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
        }
    }, [orgId, search])

    useEffect(() => {
        fetchMembers(1, false)
    }, [fetchMembers])

    const loadMore = useCallback(() => {
        if (pagination && pagination.hasMore && !isLoadingMore) {
            fetchMembers(pagination.page + 1, true)
        }
    }, [pagination, isLoadingMore, fetchMembers])

    return { 
        members, 
        pagination,
        isLoading, 
        isLoadingMore,
        error,
        loadMore,
        refetch: () => fetchMembers(1, false),
    }
}
