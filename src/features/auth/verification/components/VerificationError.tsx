import { Alert, AlertDescription } from "@/core/components/ui/alert";

interface VerificationErrorProps {
  message: string;
}

export function VerificationError({ message }: VerificationErrorProps) {
  if (!message) return null;

  return (
    <Alert className="bg-red-50 border-red-200">
      <AlertDescription className="text-red-800">{message}</AlertDescription>
    </Alert>
  );
}
