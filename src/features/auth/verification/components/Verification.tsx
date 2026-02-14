"use client";

import { Card, CardContent } from "@/core/components/ui/card";
import { useVerificationSession } from "../hooks/useVerificationSession";
import { useOTPVerification } from "../hooks/useOTPVerification";
import { VerificationHeader } from "./VerificationHeader";
import { OTPInput } from "./OTPInput";
import { VerificationSuccess } from "./VerificationSuccess";
import { VerificationError } from "./VerificationError";
import { VerificationLoading } from "./VerificationLoading";
import { VerificationUnauthenticated } from "./VerificationUnauthenticated";
import SignoutButtton from "./SignoutButtton";

export default function Verification() {
  const { session, status } = useVerificationSession();
  const { state, setState, handleResendOTP, handleVerifyOTP } =
    useOTPVerification();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <VerificationLoading />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <VerificationUnauthenticated />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <VerificationHeader
          email={session?.user?.email}
          isSuccess={state.success}
        />

        <CardContent className="space-y-6">
          {state.success ? (
            <VerificationSuccess />
          ) : (
            <>
              <VerificationError message={state.error} />

              <OTPInput
                value={state.otp}
                onChange={(otp) =>
                  setState((prev) => ({ ...prev, otp }))
                }
                onVerify={handleVerifyOTP}
                onResend={handleResendOTP}
                loading={state.loading}
                resendTimer={state.resendTimer}
              />
            </>
          )}

          <SignoutButtton />
        </CardContent>
      </Card>
    </div>
  );
}
