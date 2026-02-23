'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, X } from 'lucide-react'

interface AddColumnProps {
  onAdd: (name: string) => Promise<void>
}

export function AddColumn({ onAdd }: AddColumnProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!value.trim()) return
    setLoading(true)
    try {
      await onAdd(value.trim())
      setValue('')
      setEditing(false)
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 w-64 shrink-0 px-4 py-3 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground/60 hover:text-muted-foreground hover:border-border transition-all duration-200 hover:bg-muted/20 text-sm"
      >
        <Plus className="h-4 w-4" />
        Add column
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-72 shrink-0"
    >
      <div className="rounded-xl border bg-card p-3 space-y-2">
        <input
          autoFocus
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleConfirm()
            if (e.key === 'Escape') { setEditing(false); setValue('') }
          }}
          placeholder="Column name"
          className="w-full text-sm font-medium bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 border-b border-primary/30 pb-1"
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleConfirm}
            disabled={loading || !value.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <Check className="h-3 w-3" />
            {loading ? 'Adding…' : 'Add'}
          </button>
          <button
            onClick={() => { setEditing(false); setValue('') }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}