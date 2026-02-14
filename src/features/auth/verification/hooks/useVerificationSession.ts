import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useVerificationSession() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already verified
  useEffect(() => {
    if (status === "authenticated" && session?.user?.isVerified) {
      router.push("/app");
    }
  }, [status, session, router]);

  return { session, status };
}
