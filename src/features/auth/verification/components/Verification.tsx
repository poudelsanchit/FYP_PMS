import { Clock, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import SignoutButtton from "./SignoutButtton";

export default function VerificationPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            Verification Pending
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Your account is currently under review
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            Please contact your administrator to complete the verification
                            process. You&apos;ll receive an email notification once your account
                            has been approved.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div className="text-center text-sm text-muted-foreground">
                            <p>Need help? Contact support at</p>
                            <p className="font-medium text-foreground">
                                info.satri@gmail.com
                            </p>
                        </div>
                        <SignoutButtton />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
