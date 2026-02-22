"use client";

import { useState, useEffect, useCallback } from "react";

export interface Board {
  id: string;
  name: string;
  type: "KANBAN";
  projectId: string;
  organizationId: string;
  createdAt: string;
  _count?: { columns: number; members: number };
}

interface UseBoardsReturn {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
  addBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  refetch: () => void;
  renameBoard: (boardId: string, newName: string) => void;
}

export function useBoards(orgId: string, projectId: string): UseBoardsReturn {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/projects/${projectId}/boards`,
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to load boards");
        return;
      }
      setBoards(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [orgId, projectId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const addBoard = useCallback((board: Board) => {
    setBoards((prev) => [...prev, board]);
  }, []);

  const removeBoard = useCallback((boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
  }, []);
  const renameBoard = useCallback((boardId: string, newName: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name: newName } : b)),
    );
  }, []);

  return {
    boards,
    isLoading,
    error,
    addBoard,
    removeBoard,
    refetch: fetchBoards,
    renameBoard,
  };
}
