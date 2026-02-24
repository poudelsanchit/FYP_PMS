// src/features/dashboard/hooks/useDashboard.ts
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { DashboardProject } from "../types/types";

export function useDashboard(orgId: string) {
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchDashboard();
  }, [orgId]);

  async function fetchDashboard() {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(`/api/organizations/${orgId}/dashboard`);
      setProjects(res.data);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return { projects, isLoading, error, refetch: fetchDashboard };
}
