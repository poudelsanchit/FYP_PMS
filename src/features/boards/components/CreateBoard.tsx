"use client"

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/core/components/ui/dialog"

interface CreateBoardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateBoard({
    open,
    onOpenChange,
}: CreateBoardProps) {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden p-0 md:max-h-10/12 md:max-w-6xl">
                <DialogTitle className="sr-only">Create Board</DialogTitle>

            </DialogContent>



        </Dialog>
    )
}
