"use client"

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/core/components/ui/dialog"

interface ProjectSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProjectSettings({
    open,
    onOpenChange,
}: ProjectSettingsDialogProps) {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 md:max-h-10/12 md:max-w-6xl">
                <DialogTitle className="sr-only">Project Settings</DialogTitle>

            </DialogContent>



        </Dialog>
    )
}
