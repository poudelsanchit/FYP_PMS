"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Badge } from "@/core/components/ui/badge";
import { X, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { Alert, AlertDescription } from "@/core/components/ui/alert";

interface InviteMembersDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InvitationResult {
  success: string[];
  failed: { email: string; reason: string }[];
  alreadyMember: string[];
  alreadyInvited: string[];
}

export function InviteMembersDialog({
  orgId,
  open,
  onOpenChange,
}: InviteMembersDialogProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState<"ORG_ADMIN" | "ORG_MEMBER">("ORG_MEMBER");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvitationResult | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddEmail = () => {
    const trimmedEmail = inputValue.trim().toLowerCase();

    if (!trimmedEmail) return;

    if (!validateEmail(trimmedEmail)) {
      toast.error("Invalid email format");
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast.error("Email already added");
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setInputValue("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      handleRemoveEmail(emails[emails.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedEmails = pastedText
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email && validateEmail(email))
      .filter((email) => !emails.includes(email));

    if (pastedEmails.length > 0) {
      setEmails([...emails, ...pastedEmails]);
      toast.success(`Added ${pastedEmails.length} email(s)`);
    }
  };

  const handleSendInvitations = async () => {
    if (emails.length === 0) {
      toast.error("Please add at least one email");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitations");
      }

      const data: InvitationResult = await response.json();
      setResult(data);

      if (data.success.length > 0) {
        toast.success(`Sent ${data.success.length} invitation(s)`);
      }

      if (
        data.success.length === emails.length &&
        data.failed.length === 0 &&
        data.alreadyMember.length === 0 &&
        data.alreadyInvited.length === 0
      ) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmails([]);
    setInputValue("");
    setRole("ORG_MEMBER");
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite people to join your organization by email. You can add
            multiple emails at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Addresses</label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[100px] focus-within:ring-2 focus-within:ring-ring">
              {emails.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="h-7 px-2 gap-1"
                >
                  <Mail className="w-3 h-3" />
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  emails.length === 0
                    ? "Enter email addresses (comma or space separated)"
                    : "Add more..."
                }
                className="flex-1 min-w-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter or paste multiple emails separated by commas or
              spaces
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={role}
              onValueChange={(value) =>
                setRole(value as "ORG_ADMIN" | "ORG_MEMBER")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ORG_MEMBER">Member</SelectItem>
                <SelectItem value="ORG_ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === "ORG_ADMIN"
                ? "Admins can manage members and organization settings"
                : "Members have standard access to the organization"}
            </p>
          </div>

          {result && (
            <div className="space-y-2">
              {result.success.length > 0 && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Successfully sent {result.success.length} invitation(s)
                  </AlertDescription>
                </Alert>
              )}

              {result.alreadyMember.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Already members:</div>
                    <div className="text-sm space-y-1">
                      {result.alreadyMember.map((email) => (
                        <div key={email}>• {email}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result.alreadyInvited.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Already invited:</div>
                    <div className="text-sm space-y-1">
                      {result.alreadyInvited.map((email) => (
                        <div key={email}>• {email}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result.failed.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Failed to invite:</div>
                    <div className="text-sm space-y-1">
                      {result.failed.map(({ email, reason }) => (
                        <div key={email}>
                          • {email} - {reason}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvitations}
            disabled={isLoading || emails.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              `Send ${emails.length} Invitation${emails.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
