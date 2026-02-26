// src/features/members/hooks/useMembers.ts
import { useState, useEffect } from "react";
import axios from "axios";

export interface Member {
  id: string;
  role: "ORG_ADMIN" | "ORG_MEMBER";
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export function useMembers(orgId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`/api/organizations/${orgId}/members`);
      setMembers(response.data.members || []);
      setInvitations(response.data.invitations || []);
    } catch (err) {
      setError("Failed to load members");
      console.error("Error fetching members:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchMembers();
    }
  }, [orgId]);

  const updateMemberRole = async (
    memberId: string,
    newRole: "ORG_ADMIN" | "ORG_MEMBER"
  ) => {
    try {
      const response = await axios.patch(
        `/api/organizations/${orgId}/members/${memberId}`,
        { role: newRole }
      );
      
      // Update local state
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
      
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Failed to update member role";
      return { success: false, error: errorMessage };
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await axios.delete(`/api/organizations/${orgId}/members/${memberId}`);
      
      // Update local state
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      
      return { success: true };
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || "Failed to remove member";
      return { success: false, error: errorMessage };
    }
  };

  return {
    members,
    invitations,
    isLoading,
    error,
    refetch: fetchMembers,
    updateMemberRole,
    removeMember,
  };
}
