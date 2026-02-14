import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    isVerified?: boolean;
  }
}
