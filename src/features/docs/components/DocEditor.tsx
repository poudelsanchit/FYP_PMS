"use client";

import { useEffect } from "react";
import { useDocEditor } from "../hooks/useDocEditor";
import { EditorHeader } from "./EditorHeader";
import { SimpleEditor } from "@/features/rich-text-editor/components/tiptap-templates/simple/simple-editor";
import type { Doc, Permissions } from "../types/doc.types";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";

interface DocEditorProps {
  projectId: string;
  projectName: string;
  tenantId: string;
  docId: string;
  initialDoc: Doc;
  initialPermissions: Permissions;
}

export function DocEditor({
  projectId,
  projectName,
  tenantId,
  docId,
  initialDoc,
  initialPermissions,
}: DocEditorProps) {
  const { doc, permissions, saveStatus, updateDoc, deleteDoc, isDeleting } = useDocEditor({
    projectId,
    docId,
    initialDoc,
    initialPermissions,
  });

  const { setSegments, clear } = useBreadcrumbStore();

  // Set breadcrumbs
  useEffect(() => {
    if (doc) {
      setSegments([
        { label: projectName, href: `/app/${tenantId}/${projectId}` },
        { label: "Docs", href: `/app/${tenantId}/${projectId}/docs` },
        { label: doc.title || "Untitled" },
      ]);
    }
    return () => clear();
  }, [projectName, tenantId, projectId, doc, setSegments, clear]);

  if (!doc) {
    return <DocEditorSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header with toolbar */}
      <EditorHeader
        projectId={projectId}
        tenantId={tenantId}
        docTitle={doc.title}
        docEmoji={doc.emoji}
        saveStatus={saveStatus}
        status={doc.status}
        onStatusChange={(status) => updateDoc({ status })}
        onEmojiChange={(emoji) => updateDoc({ emoji })}
        onTitleChange={(title) => updateDoc({ title })}
        onDelete={deleteDoc}
        permissions={permissions}
        lastEditedBy={doc.authorName ?? undefined}
        updatedAt={doc.updatedAt}
      />

      {/* Editor content - only the rich text editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full h-full">
          <style>{`
            .simple-editor-wrapper {
              width: 100% !important;
              height: 100% !important;
              overflow: auto !important;
              background: transparent !important;
            }
            .simple-editor-content {
              max-width: 100% !important;
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .simple-editor-content .tiptap.ProseMirror.simple-editor {
              padding: 2rem 3rem !important;
              padding-bottom: 50vh !important;
              max-width: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              font-size: 1rem !important;
              line-height: 1.7 !important;
              min-height: 100% !important;
            }
            @media (max-width: 768px) {
              .simple-editor-content .tiptap.ProseMirror.simple-editor {
                padding: 1.5rem 1rem !important;
                padding-bottom: 50vh !important;
              }
            }
            .tiptap-toolbar {
              border-bottom: 1px solid hsl(var(--border)) !important;
              background: hsl(var(--background)) !important;
              padding: 0.5rem 1rem !important;
              position: sticky !important;
              top: 0 !important;
              z-index: 10 !important;
            }
          `}</style>
          <SimpleEditor
            initialContent={doc.content && doc.content.trim() !== "" ? JSON.parse(doc.content) : undefined}
            onSave={(content) => updateDoc({ content: JSON.stringify(content) })}
            showSaveButton={false}
          />
        </div>
      </div>
    </div>
  );
}

function DocEditorSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <Skeleton className="h-10 w-10" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}
