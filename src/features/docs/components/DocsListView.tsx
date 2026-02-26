"use client";

import { useEffect } from "react";
import { Doc } from "../types/doc.types";
import { useDocsList } from "../hooks/useDocsList";
import { DocsHeader } from "./DocsHeader";
import { DocsFilters } from "./DocsFilters";
import { DocsList } from "./DocsList";
import { Skeleton } from "@/core/components/ui/skeleton";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";

interface DocsListViewProps {
  projectId: string;
  projectName: string;
  tenantId: string;
  initialDocs: Doc[];
}

function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-8 h-8 rounded" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocsListView({
  projectId,
  projectName,
  tenantId,
  initialDocs,
}: DocsListViewProps) {
  const {
    docs,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    createDoc,
    deleteDoc,
    updateDocStatus,
  } = useDocsList({ projectId, initialDocs });

  const { setSegments, clear } = useBreadcrumbStore();

  // Set breadcrumbs
  useEffect(() => {
    setSegments([
      { label: projectName, href: `/app/${tenantId}/${projectId}` },
      { label: "Docs" },
    ]);
    return () => clear();
  }, [projectName, tenantId, projectId, setSegments, clear]);

  return (
    <div className="p-6 w-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <DocsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            createDoc={createDoc} projectId={projectId} tenantId={tenantId} projectName={projectName}
          />
        </div>
      </div>


      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <DocsList
          docs={docs}
          tenantId={tenantId}
          projectId={projectId}
          onDelete={deleteDoc}
          onUpdateStatus={updateDocStatus}
        />
      )}
    </div>
  );
}
