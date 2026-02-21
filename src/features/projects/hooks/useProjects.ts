"use client";

import { useState, useEffect, useCallback } from "react";

export interface Project {
  id: string;
  name: string;
  key: string;
  color: string;
  description?: string | null;
  organizationId: string;
  createdAt: string;
}

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  refetch: () => void;
}

export function useProjects(orgId: string): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/projects`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to load projects");
        return;
      }

      setProjects(json.data.projects);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback((project: Project) => {
    setProjects((prev) => [project, ...prev]);
  }, []);

  // inside useProjects
  const removeProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };
  return {
    projects,
    isLoading,
    error,
    addProject,
    removeProject,
    refetch: fetchProjects,
  };
}
