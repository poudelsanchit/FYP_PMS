import { create } from "zustand";

export interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationStore {
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setOrganizations: (organizations: Organization[]) => void;
  addOrganization: (organization: Organization) => void;
  removeOrganization: (organizationId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchOrganizations: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  organizations: [],
  isLoading: false,
  error: null,
};

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  ...initialState,

  setOrganizations: (organizations) => set({ organizations }),

  addOrganization: (organization) =>
    set((state) => ({
      organizations: [...state.organizations, organization],
    })),

  removeOrganization: (organizationId) =>
    set((state) => ({
      organizations: state.organizations.filter(
        (org) => org.id !== organizationId
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  fetchOrganizations: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/organizations");
      
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }

      const data = await response.json();
      set({ organizations: data.organizations || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "An error occurred",
        isLoading: false,
      });
    }
  },

  reset: () => set(initialState),
}));
