"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/core/components/ui/button";
import { SaveIndicator } from "./SaveIndicator";
import { StatusToggle } from "./StatusToggle";
import { DeleteButton } from "./DeleteButton";
import { EmojiPicker } from "./EmojiPicker";
import { TitleInput } from "./TitleInput";
import type { DocStatus, Permissions } from "../types/doc.types";
import { formatDistanceToNow } from "date-fns";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorHeaderProps {
  projectId: string;
  tenantId: string;
  docTitle: string;
  docEmoji: string;
  saveStatus: SaveStatus;
  status: DocStatus;
  onStatusChange: (status: DocStatus) => void;
  onEmojiChange: (emoji: string) => void;
  onTitleChange: (title: string) => void;
  onDelete: () => Promise<void>;
  permissions: Permissions;
  lastEditedBy?: string;
  updatedAt?: Date;
}

export function EditorHeader({
  projectId,
  tenantId,
  docTitle,
  docEmoji,
  saveStatus,
  status,
  onStatusChange,
  onEmojiChange,
  onTitleChange,
  onDelete,
  permissions,
  lastEditedBy,
  updatedAt,
}: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2 bg-background/95 backdrop-blur">
      {/* Left side - Back button and doc info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link href={`/app/${tenantId}/${projectId}/docs`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        {/* Editable emoji and title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <EmojiPicker
            emoji={docEmoji}
            onChange={onEmojiChange}
            disabled={!permissions.canEdit}
          />
          <div className="flex-1 min-w-0">
            <TitleInput
              title={docTitle}
              onChange={onTitleChange}
              disabled={!permissions.canEdit}
            />
          </div>
        </div>
      </div>

      {/* Right side - Toolbar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Last edited info */}
        {lastEditedBy && updatedAt && (
          <div className="text-xs text-muted-foreground hidden md:block">
            Edited by {lastEditedBy} {formatDistanceToNow(updatedAt, { addSuffix: true })}
          </div>
        )}

        {/* Save indicator */}
        <SaveIndicator status={saveStatus} />

        {/* Status toggle */}
        <StatusToggle
          status={status}
          onChange={onStatusChange}
          disabled={!permissions.canPublish}
        />

        {/* Delete button */}
        <DeleteButton
          onDelete={onDelete}
          projectId={projectId}
          tenantId={tenantId}
          disabled={!permissions.canDelete}
        />
      </div>
    </div>
  );
}
