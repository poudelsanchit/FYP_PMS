import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/core/components/ui/card";

export function VerificationLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <CardTitle>Loading...</CardTitle>
        <CardDescription>Please wait while we verify your session</CardDescription>
      </CardHeader>
    </Card>
  );
}
