"use client";

import { useState, useEffect, useCallback } from "react";
import { Board, Column, Issue } from "../types/types";

const BASE = (orgId: string, projectId: string, boardId: string) =>
  `/api/organizations/${orgId}/projects/${projectId}/boards/${boardId}`;

// ── Board ──────────────────────────────────────────────────────────────────
export function useBoard(orgId: string, projectId: string, boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}?includeColumns=true&includeProject=true`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load board");
      setBoard(data.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId, boardId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { board, loading, error, refetch: fetch, setBoard };
}

// ── Issues ─────────────────────────────────────────────────────────────────
export function useIssues(orgId: string, projectId: string, boardId: string) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}/issues?includeAssignees=true`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load issues");
      setIssues(data.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId, boardId]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const createIssue = useCallback(
    async (payload: {
      title: string;
      columnId: string;
      description?: string;
      labelId?: string;
      priorityId?: string;
      dueDate?: string;
      assigneeIds?: string[];
    }) => {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}/issues`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create issue");
      setIssues((prev) => [...prev, data.data]);
      return data.data as Issue;
    },
    [orgId, projectId, boardId],
  );

  const updateIssue = useCallback(
    async (
      issueId: string,
      payload: Partial<{
        title: string;
        description: string;
        columnId: string;
        order: number;
        labelId: string | null;
        priorityId: string | null;
        dueDate: string | null;
      }>,
      skipStateUpdate = false,
    ) => {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}/issues/${issueId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update issue");

      // Only update state if not skipping (for drag-and-drop, we skip since we already did optimistic update)
      if (!skipStateUpdate) {
        setIssues((prev) =>
          prev.map((i) => (i.id === issueId ? data.data : i)),
        );
      }

      return data.data as Issue;
    },
    [orgId, projectId, boardId],
  );

  const deleteIssue = useCallback(
    async (issueId: string) => {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}/issues/${issueId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete issue");
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    },
    [orgId, projectId, boardId],
  );

  // Optimistic move for drag-and-drop
  const moveIssueOptimistic = useCallback(
    (issueId: string, targetColumnId: string, newOrder: number) => {
      setIssues((prev) => {
        return prev.map((i) =>
          i.id === issueId
            ? { ...i, columnId: targetColumnId, order: newOrder }
            : i,
        );
      });
    },
    [],
  );

  return {
    issues,
    loading,
    error,
    refetch: fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    moveIssueOptimistic,
    setIssues,
  };
}

// ── Columns ────────────────────────────────────────────────────────────────
export function useColumns(orgId: string, projectId: string, boardId: string) {
  const createColumn = useCallback(
    async (name: string) => {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}/columns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create column");
      return data.data as Column;
    },
    [orgId, projectId, boardId],
  );

  const deleteColumn = useCallback(
    async (columnId: string) => {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}/columns/${columnId}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete column");
    },
    [orgId, projectId, boardId],
  );

  const renameColumn = useCallback(
    async (columnId: string, name: string) => {
      const res = await window.fetch(
        `${BASE(orgId, projectId, boardId)}/columns/${columnId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rename column");
      return data.data as Column;
    },
    [orgId, projectId, boardId],
  );

  return { createColumn, deleteColumn, renameColumn };
}
