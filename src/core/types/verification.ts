export interface VerificationState {
  otp: string;
  loading: boolean;
  error: string;
  success: boolean;
  resendTimer: number;
}

export interface VerificationActions {
  setOtp: (otp: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccess: (success: boolean) => void;
  setResendTimer: (timer: number) => void;
}
