"use client";

import { useState, useCallback } from "react";

export interface ProjectLabel {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export function useProjectLabels(orgId: string, projectId: string) {
  const [labels, setLabels] = useState<ProjectLabel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = `/api/organizations/${orgId}/projects/${projectId}/labels`;

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(baseUrl);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load labels");
      setLabels(data.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  const add = async (name: string, color: string) => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create label");
    setLabels((prev) =>
      [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const update = async (id: string, name: string, color: string) => {
    const res = await fetch(`${baseUrl}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update label");
    setLabels((prev) =>
      prev
        .map((l) => (l.id === id ? data.data : l))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const remove = async (id: string) => {
    const res = await fetch(`${baseUrl}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to delete label");
    }
    setLabels((prev) => prev.filter((l) => l.id !== id));
  };

  return { labels, isLoading, error, fetch: fetch_, add, update, remove };
}
