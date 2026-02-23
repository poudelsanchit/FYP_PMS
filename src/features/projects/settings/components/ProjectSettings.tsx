'use client'

import { useEffect } from 'react'
import { Flag, Tag } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/core/components/ui/dialog'
import { Button } from '@/core/components/ui/button'
import { Separator } from '@/core/components/ui/separator'
import { useProjectLabels } from '../hooks/useProjectLabel'
import { useProjectPriorities } from '../hooks/Useprojectpriorities'
import { SettingsSection } from './SettingsSection'
import { EditableItem } from './EditableItem'
import { AddItemRow } from './Additemrow'

interface ProjectSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    orgId: string
    projectId: string
    projectName: string
}

export function ProjectSettingsDialog({
    open,
    onOpenChange,
    orgId,
    projectId,
    projectName,
}: ProjectSettingsDialogProps) {
    const labels = useProjectLabels(orgId, projectId)
    const priorities = useProjectPriorities(orgId, projectId)

    useEffect(() => {
        if (open) {
            labels.fetch()
            priorities.fetch()
        }
    }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl p-0 gap-0">

                <DialogHeader className="px-5 pt-5 pb-4">
                    <DialogTitle className="text-sm font-semibold">Project Settings</DialogTitle>
                    <p className="text-xs text-muted-foreground">{projectName}</p>
                </DialogHeader>

                <Separator />

                <div className="overflow-y-auto max-h-[65vh] px-5 py-5 space-y-6">

                    {/* Labels */}
                    <SettingsSection
                        icon={<Tag className="h-3.5 w-3.5" />}
                        title="Labels"
                        description="Categorize tasks with custom labels"
                        isLoading={labels.isLoading}
                        error={labels.error}
                        onRetry={labels.fetch}
                    >
                        {labels.labels.length === 0 && (
                            <p className="text-xs text-muted-foreground/60 px-1 py-1">No labels yet</p>
                        )}
                        {labels.labels.map((label) => (
                            <EditableItem
                                key={label.id}
                                id={label.id}
                                name={label.name}
                                color={label.color}
                                onUpdate={labels.update}
                                onDelete={labels.remove}
                            />
                        ))}
                        <div className="pt-1">
                            <AddItemRow placeholder="Label name" onAdd={labels.add} />
                        </div>
                    </SettingsSection>

                    <Separator />

                    {/* Priorities */}
                    <SettingsSection
                        icon={<Flag className="h-3.5 w-3.5" />}
                        title="Priorities"
                        description="Define urgency levels for tasks"
                        isLoading={priorities.isLoading}
                        error={priorities.error}
                        onRetry={priorities.fetch}
                    >
                        {priorities.priorities.length === 0 && (
                            <p className="text-xs text-muted-foreground/60 px-1 py-1">No priorities yet</p>
                        )}
                        {priorities.priorities.map((priority) => (
                            <EditableItem
                                key={priority.id}
                                id={priority.id}
                                name={priority.name}
                                color={priority.color}
                                onUpdate={priorities.update}
                                onDelete={priorities.remove}
                            />
                        ))}
                        <div className="pt-1">
                            <AddItemRow placeholder="Priority name" onAdd={priorities.add} />
                        </div>
                    </SettingsSection>

                </div>

                <Separator />

                <DialogFooter className="px-5 py-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Done
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}