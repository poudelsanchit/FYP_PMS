import { Avatar, AvatarFallback, AvatarImage } from '@/core/components/ui/avatar'
import { ReportIssue } from '../../hooks/useBoardReports'

interface IssueTableProps {
    issues: ReportIssue[]
    columns: Array<{
        key: string
        label: string
        render: (issue: ReportIssue) => React.ReactNode
    }>
}

export function IssueTable({ issues, columns }: IssueTableProps) {
    if (issues.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-muted-foreground">
                No issues to display
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b text-sm text-muted-foreground">
                        {columns.map(col => (
                            <th key={col.key} className="text-left py-2 px-2 font-medium">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {issues.map(issue => (
                        <tr key={issue.id} className="border-b last:border-0 hover:bg-accent/50">
                            {columns.map(col => (
                                <td key={col.key} className="py-3 px-2 text-sm">
                                    {col.render(issue)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export function PriorityBadge({ priority }: { priority: { name: string; color: string } | null }) {
    if (!priority) return null
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
                backgroundColor: `${priority.color}18`,
                color: priority.color,
            }}
        >
            {priority.name}
        </span>
    )
}

export function LabelBadge({ label }: { label: { name: string; color: string } | null }) {
    if (!label) return null
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
                backgroundColor: `${label.color}18`,
                color: label.color,
            }}
        >
            {label.name}
        </span>
    )
}

export function AssigneeAvatars({ assignees }: { assignees: Array<{ id: string; name: string | null; avatar: string | null }> }) {
    if (assignees.length === 0) return <span className="text-muted-foreground text-xs">Unassigned</span>
    
    return (
        <div className="flex -space-x-1">
            {assignees.slice(0, 3).map(assignee => (
                <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={assignee.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                        {assignee.name?.[0] || '?'}
                    </AvatarFallback>
                </Avatar>
            ))}
            {assignees.length > 3 && (
                <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
                    +{assignees.length - 3}
                </div>
            )}
        </div>
    )
}
