"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Doc, DocStatus } from "../types/doc.types";

type StatusFilter = "all" | "published" | "draft";

interface UseDocsListProps {
  projectId: string;
  initialDocs?: Doc[];
}

interface UseDocsListReturn {
  docs: Doc[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  createDoc: () => Promise<string | null>;
  deleteDoc: (docId: string) => Promise<void>;
  updateDocStatus: (docId: string, status: DocStatus) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useDocsList({
  projectId,
  initialDocs = [],
}: UseDocsListProps): UseDocsListReturn {
  const [allDocs, setAllDocs] = useState<Doc[]>(initialDocs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const url = `/api/projects/${projectId}/docs${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to load documents");
        return;
      }

      setAllDocs(json.data.docs);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Client-side filtering for search
  const docs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allDocs;
    }

    const query = searchQuery.toLowerCase();
    return allDocs.filter((doc) =>
      doc.title.toLowerCase().includes(query)
    );
  }, [allDocs, searchQuery]);

  const createDoc = useCallback(async (): Promise<string | null> => {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to create document");
        return null;
      }

      // Add new doc to the list
      setAllDocs((prev) => [json.data.doc, ...prev]);

      return json.data.doc.id;
    } catch {
      setError("Network error. Please try again.");
      return null;
    }
  }, [projectId]);

  const refetch = useCallback(async () => {
    await fetchDocs();
  }, [fetchDocs]);

  const deleteDoc = useCallback(async (docId: string): Promise<void> => {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to delete document");
        throw new Error(json.error ?? "Failed to delete document");
      }

      // Remove doc from the list
      setAllDocs((prev) => prev.filter((doc) => doc.id !== docId));
    } catch (err) {
      setError("Failed to delete document");
      throw err;
    }
  }, [projectId]);

  const updateDocStatus = useCallback(async (docId: string, status: DocStatus): Promise<void> => {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to update document");
        throw new Error(json.error ?? "Failed to update document");
      }

      // Update doc in the list
      setAllDocs((prev) =>
        prev.map((doc) =>
          doc.id === docId ? { ...doc, status } : doc
        )
      );
    } catch (err) {
      setError("Failed to update document");
      throw err;
    }
  }, [projectId]);

  return {
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
    refetch,
  };
}
