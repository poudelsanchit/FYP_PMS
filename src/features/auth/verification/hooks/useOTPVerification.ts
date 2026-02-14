import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { VerificationState } from "@/core/types/verification";

export function useOTPVerification() {
  const router = useRouter();
  const [state, setState] = useState<VerificationState>({
    otp: "",
    loading: false,
    error: "",
    success: false,
    resendTimer: 0,
  });

  // Resend timer countdown
  useEffect(() => {
    if (state.resendTimer > 0) {
      const timer = setTimeout(
        () =>
          setState((prev) => ({
            ...prev,
            resendTimer: prev.resendTimer - 1,
          })),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [state.resendTimer]);

  const handleResendOTP = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));

      const toastId = toast.loading("Sending OTP...");

      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
      });

      if (!response.ok) {
        toast.dismiss(toastId);
        throw new Error("Failed to resend OTP");
      }

      toast.dismiss(toastId);
      toast.success("OTP sent successfully!");
      setState((prev) => ({ ...prev, resendTimer: 60 }));
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to resend OTP";
      setState((prev) => ({ ...prev, error: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyOTP = async () => {
    if (state.otp.length !== 6) {
      const errorMsg = "Please enter a valid 6-digit OTP";
      setState((prev) => ({ ...prev, error: errorMsg }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));

      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: state.otp }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify OTP");
      }

      setState((prev) => ({ ...prev, success: true, otp: "" }));
      toast.success("Email verified successfully!");

      setTimeout(() => router.push("/app"), 2000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to verify OTP";
      setState((prev) => ({ ...prev, error: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return {
    state,
    setState,
    handleResendOTP,
    handleVerifyOTP,
  };
}
