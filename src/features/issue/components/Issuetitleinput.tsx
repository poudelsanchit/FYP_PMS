'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/core/utils/utils'

interface IssueTitleInputProps {
    value: string
    onChange: (v: string) => void
    onEnter?: () => void
    placeholder?: string
    hasError?: boolean
}

export interface IssueTitleInputHandle {
    focus: () => void
}

export const IssueTitleInput = forwardRef<IssueTitleInputHandle, IssueTitleInputProps>(
    ({ value, onChange, onEnter, placeholder = 'Issue title', hasError }, ref) => {
        const innerRef = useRef<HTMLTextAreaElement>(null)

        useImperativeHandle(ref, () => ({
            focus: () => innerRef.current?.focus(),
        }))

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e.target.value)
            // Auto-grow
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
        }

        const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onEnter?.()
            }
        }

        return (
            <textarea
                ref={innerRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                required
                className={cn(
                    'w-full resize-none overflow-hidden bg-transparent',
                    'text-lg font-semibold leading-snug text-foreground',
                    'placeholder:text-muted-foreground/50 focus:outline-none',
                    hasError && 'placeholder:text-destructive/50'
                )}
            />
        )
    }
)

IssueTitleInput.displayName = 'IssueTitleInput'