import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "../prisma/prisma";
import { generateOTP, sendOTPEmail } from "../otp/otp";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // JWT sessions
  },

  callbacks: {
    // Sign in callback: runs only on login
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile) {
        const { name, email, picture, sub } = profile as {
          name?: string;
          email: string;
          picture?: string;
          sub: string;
        };

        const higherResImage = picture?.replace("=s96-c", "=s400-c");

        try {
          const existingUser = await prisma.user.findUnique({ where: { email } });
          let isNewUser = false;

          if (!existingUser) {
            // New user - mark as unverified
            const newUser = await prisma.user.create({
              data: {
                email,
                name: name || null,
                avatar: higherResImage || null,
                googleId: sub,
                isVerified: false,
              },
            });
            isNewUser = true;

            // Create default organization for new user
            const orgName = name ? `${name}'s ORG` : "My ORG";
            await prisma.organization.create({
              data: {
                name: orgName,
                members: {
                  create: {
                    userId: newUser.id,
                    role: "ORG_ADMIN",
                  },
                },
              },
            });
          } else if (!existingUser.googleId) {
            // Existing user without Google ID - mark as unverified
            await prisma.user.update({
              where: { email },
              data: {
                googleId: sub,
                avatar: higherResImage || existingUser.avatar,
                isVerified: false,
              },
            });
            isNewUser = true;
          }

          // Send OTP only for new users
          if (isNewUser) {
            const code = await generateOTP(email);
            await sendOTPEmail(email, code);
          }
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },

    // JWT callback: runs on login AND on every request
    async jwt({ token, user }) {
      if (user?.email) {
        // On login: fetch user from DB to get the actual ID
        const dbUser = await prisma.user.findUnique({ 
          where: { email: user.email },
          select: { id: true, email: true, isVerified: true }
        });
        
        if (dbUser) {
          token.userId = dbUser.id;
          token.email = dbUser.email;
          token.isVerified = dbUser.isVerified;
        }
      } else if (token.email) {
        // On every request: fetch dynamic fields from DB
        const dbUser = await prisma.user.findUnique({ 
          where: { email: token.email as string },
          select: { id: true, isVerified: true }
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.isVerified = dbUser.isVerified;
        }
      }

      return token;
    },

    // Session callback: attach stable + dynamic info to session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
};
