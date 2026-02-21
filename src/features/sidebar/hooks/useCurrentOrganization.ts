"use client";
import { useEffect, useState } from "react";

export interface CurrentOrganization {
  id: string;
  name: string;
  logo?: string;
  plan?: string;
  memberCount?: number;
  role?: "ORG_ADMIN" | "ORG_MEMBER";
}

export function useCurrentOrganization(orgId?: string) {
  const [organization, setOrganization] = useState<CurrentOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state immediately when orgId changes
    setOrganization(null);
    setError(null);
    
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchOrganization = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/organizations/${orgId}`, {
          cache: 'no-store', // Prevent caching
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch organization");
        }

        const data = await response.json();
        
        // Only update state if this effect hasn't been cancelled
        if (!isCancelled) {
          setOrganization(data.organization);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOrganization();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isCancelled = true;
    };
  }, [orgId]);

  return { organization, isLoading, error };
}
