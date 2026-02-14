import { Card, CardHeader, CardTitle, CardDescription } from "@/core/components/ui/card";

export function VerificationUnauthenticated() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Not Authenticated</CardTitle>
        <CardDescription>Please sign in first</CardDescription>
      </CardHeader>
    </Card>
  );
}
