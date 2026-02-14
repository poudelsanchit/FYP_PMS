import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "../prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile) {
        const { name, email, picture, sub } = profile as {
          name?: string;
          email: string;
          picture?: string;
          sub: string;
        };

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email },
          });

          const higherResImage = picture?.replace("=s96-c", "=s400-c");

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email,
                name: name || null,
                avatar: higherResImage || null,
                googleId: sub,
                isVerified: true,
              },
            });
          } else if (!existingUser.googleId) {
            // Update existing user with Google ID if they don't have one
            await prisma.user.update({
              where: { email },
              data: {
                googleId: sub,
                avatar: higherResImage || existingUser.avatar,
                isVerified: true,
              },
            });
          }
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.isVerified = dbUser.isVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.isVerified = dbUser.isVerified;
        }
      }
      return session;
    },
  },
};
