'use client';

/**
 * Example component showing how to integrate limit checks in your UI
 * This demonstrates the pattern for projects, but can be adapted for other resources
 */

import { useState } from 'react';
import { useBillingLimits } from '@/core/hooks/useBillingLimits';
import { useCheckLimit } from '@/core/hooks/useCheckLimit';
import { LimitWarning, LimitProgress } from './LimitWarning';
import { Button } from '@/core/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';

interface CreateProjectDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProjectDialog({
  orgId,
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectDialogProps) {
  const { limits, loading } = useBillingLimits(orgId);
  const { canPerformAction } = useCheckLimit(limits);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    // Check limit before attempting to create
    const check = canPerformAction('projects');
    if (!check.allowed) {
      alert(check.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/organizations/${orgId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, key }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create project');
        return;
      }

      setName('');
      setKey('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        {/* Show limit warning if reached */}
        <LimitWarning limits={limits} resource="projects" action="create a project" />

        {/* Show current usage */}
        <LimitProgress limits={limits} resource="projects" />

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
            />
          </div>

          <div>
            <Label htmlFor="key">Project Key</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="PROJ"
              maxLength={10}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={isSubmitting || loading || !name || !key}
            className="w-full"
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
