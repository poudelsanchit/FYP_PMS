import { Mail } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";

interface VerificationHeaderProps {
  email?: string;
  isSuccess: boolean;
}

export function VerificationHeader({
  email,
  isSuccess,
}: VerificationHeaderProps) {
  return (
    <CardHeader className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
        <Mail className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <CardTitle className="text-2xl font-bold">
          {isSuccess ? "Verified!" : "Verify Your Email"}
        </CardTitle>
        <CardDescription className="mt-2">
          {isSuccess
            ? "Your account has been verified successfully"
            : `Enter the 6-digit code sent to ${email}`}
        </CardDescription>
      </div>
    </CardHeader>
  );
}
