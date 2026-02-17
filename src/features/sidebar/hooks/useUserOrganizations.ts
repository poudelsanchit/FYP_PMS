"use client";
import { useEffect } from "react";
import { useOrganizationStore } from "@/core/stores/useOrganizationStore";

export interface Organization {
  id: string;
  name: string;
  role: string;
  memberCount?: number;
}

export function useUserOrganizations() {
  const { organizations, isLoading, error, fetchOrganizations } =
    useOrganizationStore();

  useEffect(() => {
    // Only fetch if we don't have organizations yet
    if (organizations.length === 0 && !isLoading) {
      fetchOrganizations();
    }
  }, []);

  return {
    organizations,
    isLoading,
    error,
    refetch: fetchOrganizations,
  };
}
