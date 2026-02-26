"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";
import { Doc } from "../types/doc.types";
import { getRelativeTime } from "@/core/lib/docs/timeUtils";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2, ArrowUpRight, FileText } from "lucide-react";
import { cn } from "@/core/utils/utils";

interface DocCardProps {
  doc: Doc;
  tenantId: string;
  projectId: string;
  index?: number;
  onDelete?: (docId: string) => Promise<void>;
  onPublish?: (docId: string, status: "draft" | "published") => Promise<void>;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function DocCard({
  doc,
  tenantId,
  projectId,
  index,
  onDelete,
  onPublish,
}: DocCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-dropdown-trigger]")) return;
    router.push(`/app/${tenantId}/${projectId}/docs/${doc.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete(doc.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete document:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onPublish) return;

    const newStatus = doc.status === "published" ? "draft" : "published";
    try {
      await onPublish(doc.id, newStatus);
    } catch (error) {
      console.error("Failed to update document status:", error);
    } finally {
      setIsMenuOpen(false);
    }
  };

  const isPublished = doc.status === "published";

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col pb-",
        "border rounded-lg bg-sidebar hover:bg-accent/50",
        "p-3 cursor-pointer h-[130px]",
        "transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
      )}
    >
      {/* Icon and Title at the top */}
      <div className="flex items-start gap-2 mb-2">
        {/* Doc icon/emoji */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
          {doc.emoji || "📄"}
        </div>

        {/* Title and arrow */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-1.5">
          <h3 className={cn(
            "font-semibold text-sm leading-tight line-clamp-2",
            doc.title ? "text-foreground" : "text-muted-foreground italic"
          )}>
            {doc.title || "Untitled"}
          </h3>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors shrink-0" />
        </div>
      </div>

      {/* Status badge and actions */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium",
            isPublished
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isPublished ? "Published" : "Draft"}
        </span>

        {/* Actions dropdown */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger
            data-dropdown-trigger
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "p-1 rounded-md hover:bg-muted",
              isMenuOpen && "opacity-100"
            )}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handlePublish} className="cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              {isPublished ? "Unpublish" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeleteClick}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Author and time at the bottom */}
      <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="w-4 h-4 shrink-0">
            <AvatarImage src={doc.authorAvatar ?? undefined} />
            <AvatarFallback className="text-[7px] font-medium">
              {getInitials(doc.authorName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground truncate">
            {doc.authorName || "Unknown"}
          </span>
        </div>

        <span className="text-[11px] text-muted-foreground shrink-0">
          {getRelativeTime(doc.updatedAt)}
        </span>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{doc.title || 'Untitled'}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}