'use client'

interface IssueDescriptionInputProps {
    id?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
}

export function IssueDescriptionInput({
    id,
    value,
    onChange,
    placeholder = "Add description… ",
}: IssueDescriptionInputProps) {
    return (
        <textarea
            id={id}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:text-foreground"
        />
    )
}