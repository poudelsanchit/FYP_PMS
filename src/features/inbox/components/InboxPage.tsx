"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { Separator } from "@/core/components/ui/separator";
import {
  Building2,
  Check,
  X,
  Mail,
  Clock,
  Crown,
  User as UserIcon,
  Inbox as InboxIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/core/utils/utils";
import { useOrganizationStore } from "@/core/stores/useOrganizationStore";

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
  };
}

export function InboxPage() {
  const router = useRouter();
  const { fetchOrganizations } = useOrganizationStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
        if (data.invitations?.length > 0 && !selectedInvitation) {
          setSelectedInvitation(data.invitations[0]);
        }
      }
    } catch (error) {
      toast.error("Failed to load invitations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleInvitation = async (
    invitationId: string,
    action: "accept" | "reject",
    orgId: string,
    orgName: string
  ) => {
    try {
      setProcessingId(invitationId);
      const response = await fetch(`/api/user/invitations/${invitationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process invitation");
      }

      if (action === "accept") {
        toast.success(`Joined ${orgName} successfully!`);

        // Refresh organizations in the store
        await fetchOrganizations();

        // Navigate to the new organization
        setTimeout(() => {
          router.push(`/app/${orgId}`);
        }, 500);
      } else {
        toast.success("Invitation declined");
      }

      // Remove the invitation from the list
      setInvitations((prev) => {
        const filtered = prev.filter((inv) => inv.id !== invitationId);
        if (selectedInvitation?.id === invitationId) {
          setSelectedInvitation(filtered[0] || null);
        }
        return filtered;
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to process invitation"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExpiryText = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays <= 0) return "Expired";
    if (diffInDays === 1) return "Expires in 1 day";
    return `Expires in ${diffInDays} days`;
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Invitation List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Inbox</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {invitations.length} invitation{invitations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <InboxIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No invitations</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="p-2">
              {invitations.map((invitation) => (
                <button
                  key={invitation.id}
                  onClick={() => setSelectedInvitation(invitation)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors mb-1",
                    selectedInvitation?.id === invitation.id &&
                    "bg-muted border border-border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {invitation.organization.name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDate(invitation.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Organization invitation as{" "}
                        {invitation.role === "ORG_ADMIN" ? "Admin" : "Member"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={
                            invitation.role === "ORG_ADMIN"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs h-5"
                        >
                          {invitation.role === "ORG_ADMIN" ? "Admin" : "Member"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Invitation Details */}
      <div className="flex-1 flex flex-col">
        {!selectedInvitation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Mail className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No invitation selected</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Select an invitation from the list to view its details
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      Organization Invitation
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {formatFullDate(selectedInvitation.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    selectedInvitation.role === "ORG_ADMIN"
                      ? "default"
                      : "secondary"
                  }
                  className="flex items-center gap-1"
                >
                  {selectedInvitation.role === "ORG_ADMIN" ? (
                    <Crown className="w-3 h-3" />
                  ) : (
                    <UserIcon className="w-3 h-3" />
                  )}
                  {selectedInvitation.role === "ORG_ADMIN" ? "Admin" : "Member"}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    handleInvitation(
                      selectedInvitation.id,
                      "accept",
                      selectedInvitation.organization.id,
                      selectedInvitation.organization.name
                    )
                  }
                  disabled={processingId === selectedInvitation.id}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Accept Invitation
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleInvitation(
                      selectedInvitation.id,
                      "reject",
                      selectedInvitation.organization.id,
                      selectedInvitation.organization.name
                    )
                  }
                  disabled={processingId === selectedInvitation.id}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Decline
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl space-y-6">
                {/* Main Message */}
                <div className="bg-muted/50 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-3">
                    You've been invited to join{" "}
                    {selectedInvitation.organization.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have been invited to join this organization as{" "}
                    {selectedInvitation.role === "ORG_ADMIN"
                      ? "an Admin"
                      : "a Member"}
                    . Accepting this invitation will give you access to the
                    organization's projects, boards, and resources.
                  </p>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Organization:
                      </span>
                      <span className="font-medium">
                        {selectedInvitation.organization.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Sent to:</span>
                      <span className="font-medium">
                        {selectedInvitation.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">
                        {getExpiryText(selectedInvitation.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Information */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {selectedInvitation.role === "ORG_ADMIN" ? (
                      <>
                        <Crown className="w-4 h-4 text-blue-600" />
                        Admin Role
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        Member Role
                      </>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedInvitation.role === "ORG_ADMIN"
                      ? "As an Admin, you'll have full access to manage the organization, invite members, create projects, and configure settings."
                      : "As a Member, you'll have access to view and collaborate on projects within the organization."}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
