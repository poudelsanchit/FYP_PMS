import { useEffect } from 'react'

// Custom event for inbox refresh
export const INBOX_REFRESH_EVENT = 'inbox-refresh'

export const triggerInboxRefresh = () => {
    window.dispatchEvent(new CustomEvent(INBOX_REFRESH_EVENT))
}

export const useInboxRefresh = (callback: () => void) => {
    useEffect(() => {
        window.addEventListener(INBOX_REFRESH_EVENT, callback)
        return () => window.removeEventListener(INBOX_REFRESH_EVENT, callback)
    }, [callback])
}
