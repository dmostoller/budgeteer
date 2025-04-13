import { auth } from "better-auth";
import { google } from "better-auth/providers";

import { env } from "@/lib/env";
import prisma from "@/lib/db";

export const { handlers, signIn, signOut, auth: getAuth } = auth({
  basePath: "/api/auth",
  session: { strategy: "jwt" },
  providers: [
    google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.id = profile.sub;
        token.name = profile.name;
        token.email = profile.email;
        token.picture = profile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ profile }) {
      if (!profile?.email) {
        return false;
      }
      
      // Create or update user in the database
      await prisma.user.upsert({
        where: { email: profile.email },
        create: {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        },
        update: {
          name: profile.name,
          image: profile.picture,
        },
      });
      
      return true;
    },
  },
});
