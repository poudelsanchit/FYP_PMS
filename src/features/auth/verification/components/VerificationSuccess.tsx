import { Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/core/components/ui/alert";

export function VerificationSuccess() {
  return (
    <Alert className="bg-green-50 border-green-200">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        Redirecting to dashboard...
      </AlertDescription>
    </Alert>
  );
}
