"use client";

import { Doc, DocStatus } from "../types/doc.types";
import { DocCard } from "./DocCard";
import { FileText } from "lucide-react";

interface DocsListProps {
  docs: Doc[];
  tenantId: string;
  projectId: string;
  onDelete: (docId: string) => Promise<void>;
  onUpdateStatus: (docId: string, status: DocStatus) => Promise<void>;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <FileText className="w-7 h-7 opacity-40" />
      </div>
      <p className="text-sm font-medium">No documents yet</p>
      <p className="text-xs mt-1">Create your first document to get started</p>
    </div>
  );
}

export function DocsList({ docs, tenantId, projectId, onDelete, onUpdateStatus }: DocsListProps) {
  if (docs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {docs.map((doc) => (
        <DocCard 
          key={doc.id} 
          doc={doc} 
          tenantId={tenantId} 
          projectId={projectId}
          onDelete={onDelete}
          onPublish={onUpdateStatus}
        />
      ))}
    </div>
  );
}
