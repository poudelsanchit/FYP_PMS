import { Loader2 } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/core/components/ui/input-otp";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  loading: boolean;
  resendTimer: number;
}

export function OTPInput({
  value,
  onChange,
  onVerify,
  onResend,
  loading,
  resendTimer,
}: OTPInputProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={value}
          onChange={onChange}
          disabled={loading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={onVerify}
        disabled={loading || value.length !== 6}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify OTP"
        )}
      </Button>

      <div className="text-center text-sm">
        <p className="text-muted-foreground">Didn't receive the code?</p>
        <Button
          variant="link"
          onClick={onResend}
          disabled={resendTimer > 0 || loading}
          className="p-0 h-auto"
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
        </Button>
      </div>
    </div>
  );
}
