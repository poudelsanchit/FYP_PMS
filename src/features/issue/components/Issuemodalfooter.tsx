'use client'

import { Plus, Loader2 } from 'lucide-react'
import { Switch } from '@/core/components/ui/switch'
import { Label } from '@/core/components/ui/label'

interface IssueModalFooterProps {
    submitting: boolean
    canSubmit: boolean
    createAnother: boolean
    onCreateAnotherChange: (v: boolean) => void
    onCancel: () => void
}

export function IssueModalFooter({
    submitting,
    canSubmit,
    createAnother,
    onCreateAnotherChange,
    onCancel,
}: IssueModalFooterProps) {
    return (
        <div className="flex items-center justify-between px-5 py-3">
            {/* Create another */}
            <div className="flex items-center gap-2">
                <Switch
                    id="create-another"
                    checked={createAnother}
                    onCheckedChange={onCreateAnotherChange}
                    className="scale-[0.8] origin-left"
                />
                <Label
                    htmlFor="create-another"
                    className="text-xs text-foreground cursor-pointer select-none"
                >
                    Create another
                </Label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Creating…
                        </>
                    ) : (
                        <>
                            <Plus className="h-3.5 w-3.5" />
                            Create issue
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}