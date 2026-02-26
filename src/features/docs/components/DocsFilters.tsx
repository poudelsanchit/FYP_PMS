"use client";

import { Input } from "@/core/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { DocsHeader } from "./DocsHeader";

type StatusFilter = "all" | "published" | "draft";

interface DocsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  projectName: string;
  projectId: string;
  tenantId: string;
  createDoc: () => Promise<string | null>;
}

export function DocsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  createDoc,
  projectId,
  projectName,
  tenantId

}: DocsFiltersProps) {
  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "published", label: "Published" },
    { value: "draft", label: "Drafts" },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Search Input */}
      <div className="flex gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <DocsHeader onCreateDoc={createDoc} projectId={projectId} tenantId={tenantId} projectName={projectName} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusFilterChange(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors relative",
              statusFilter === tab.value
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {statusFilter === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
