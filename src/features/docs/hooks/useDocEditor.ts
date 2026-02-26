"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Doc, Permissions } from "../types/doc.types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseDocEditorProps {
  projectId: string;
  docId: string;
  initialDoc: Doc;
  initialPermissions: Permissions;
}

interface UseDocEditorReturn {
  doc: Doc;
  permissions: Permissions;
  saveStatus: SaveStatus;
  updateDoc: (updates: Partial<Doc>) => void;
  deleteDoc: () => Promise<void>;
  isDeleting: boolean;
}

export function useDocEditor({
  projectId,
  docId,
  initialDoc,
  initialPermissions,
}: UseDocEditorProps): UseDocEditorReturn {
  const [doc, setDoc] = useState<Doc>(initialDoc);
  const [permissions] = useState<Permissions>(initialPermissions);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<Doc>>({});

  // Function to persist updates to the server
  const persistUpdates = useCallback(
    async (updates: Partial<Doc>) => {
      setSaveStatus("saving");

      try {
        const res = await fetch(
          `/api/projects/${projectId}/docs/${docId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          }
        );

        const json = await res.json();

        if (!res.ok || !json.success) {
          console.error("Failed to save document:", json.error);
          setSaveStatus("error");
          return;
        }

        // Update the doc with the server response (includes updated timestamp)
        if (json.data?.doc) {
          setDoc((prev) => ({
            ...prev,
            updatedAt: json.data.doc.updatedAt,
          }));
        }

        setSaveStatus("saved");

        // Reset to idle after showing "saved" for 2 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Network error while saving:", error);
        setSaveStatus("error");
      }
    },
    [projectId, docId]
  );

  // Debounced update function
  const updateDoc = useCallback(
    (updates: Partial<Doc>) => {
      // Optimistic update - immediately update local state
      setDoc((prev) => ({
        ...prev,
        ...updates,
      }));

      // Accumulate pending updates
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates,
      };

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for 1.5 seconds
      debounceTimerRef.current = setTimeout(() => {
        const updatesToSend = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {};
        persistUpdates(updatesToSend);
      }, 1500);
    },
    [persistUpdates]
  );

  // Delete function
  const deleteDoc = useCallback(async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/docs/${docId}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        console.error("Failed to delete document:", json.error);
        throw new Error(json.error ?? "Failed to delete document");
      }

      // Navigation will be handled by the component
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [projectId, docId]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    doc,
    permissions,
    saveStatus,
    updateDoc,
    deleteDoc,
    isDeleting,
  };
}
