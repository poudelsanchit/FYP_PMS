"use client";

import { useParams } from "next/navigation";
import { Button } from "@/core/components/ui/button";
import { UserPlus, Crown, User as UserIcon, Mail, MoreVertical, Shield, UserX } from "lucide-react";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { ChangeRoleDialog } from "./ChangeRoleDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { useMembers, type Member } from "../hooks/useMembers";

export function MembersPage() {
  const params = useParams();
  const orgId = params.tenantId as string;
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { setSegments, clear } = useBreadcrumbStore();

  const {
    members,
    invitations,
    isLoading,
    error,
    refetch,
    updateMemberRole,
    removeMember,
  } = useMembers(orgId);

  useEffect(() => {
    setSegments([{ label: "Members" }]);
    return () => clear();
  }, [setSegments, clear]);

  const handleInviteSuccess = () => {
    refetch();
  };

  const handleChangeRole = (member: Member) => {
    setSelectedMember(member);
    setIsChangeRoleDialogOpen(true);
  };

  const handleRemoveMember = (member: Member) => {
    setSelectedMember(member);
    setIsRemoveMemberDialogOpen(true);
  };

  const handleConfirmRoleChange = async (
    memberId: string,
    newRole: "ORG_ADMIN" | "ORG_MEMBER"
  ) => {
    const result = await updateMemberRole(memberId, newRole);
    if (result.success) {
      toast.success("Member role updated successfully");
    } else {
      toast.error(result.error || "Failed to update member role");
    }
  };

  const handleConfirmRemoveMember = async (memberId: string) => {
    const result = await removeMember(memberId);
    if (result.success) {
      toast.success("Member removed successfully");
    } else {
      toast.error(result.error || "Failed to remove member");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Members</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your organization members and invitations
            </p>
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Active Members */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Active Members ({members.length})
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <UserIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user.avatar || undefined} />
                    <AvatarFallback>
                      {member.user.name?.charAt(0).toUpperCase() ||
                        member.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.user.name || "Anonymous User"}
                      </p>
                      {member.role === "ORG_ADMIN" && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                  <Badge variant={member.role === "ORG_ADMIN" ? "default" : "secondary"}>
                    {member.role === "ORG_ADMIN" ? "Admin" : "Member"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangeRole(member)}>
                        <Shield className="w-4 h-4 mr-2" />
                        Change role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveMember(member)}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Pending Invitations ({invitations.length})
            </h2>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center gap-4 p-4 border rounded-lg border-dashed"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited{" "}
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {invitation.role === "ORG_ADMIN" ? "Admin" : "Member"}
                  </Badge>
                  <Badge variant="secondary">Pending</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Resend invitation</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Cancel invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <InviteMembersDialog
        orgId={orgId}
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSuccess={handleInviteSuccess}
      />

      <ChangeRoleDialog
        open={isChangeRoleDialogOpen}
        onOpenChange={setIsChangeRoleDialogOpen}
        member={selectedMember}
        onConfirm={handleConfirmRoleChange}
      />

      <RemoveMemberDialog
        open={isRemoveMemberDialogOpen}
        onOpenChange={setIsRemoveMemberDialogOpen}
        member={selectedMember}
        onConfirm={handleConfirmRemoveMember}
      />
    </div>
  );
}
