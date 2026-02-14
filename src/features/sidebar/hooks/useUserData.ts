// hooks/useUserData.ts
import { useSession } from "next-auth/react";

const dummyData = {
  name: "",
  email: "",
  id: "",
};

export const useUserData = () => {
  const { data: session } = useSession();

  return session?.user
    ? {
        name: session.user.name || "",
        email: session.user.email || "",
        id: session.user.id || "",
      }
    : dummyData;
};
