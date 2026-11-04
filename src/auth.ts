import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";

import { prisma } from "@/libs/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // Without this, sign-in fails with UntrustedHost anywhere but Vercel, including `next start`.
  trustHost: true,

  providers: [Google, Apple],

  session: {
    strategy: "jwt",
  },

  pages: {
    error: "/auth/auth-code-error",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "CUSTOMER";
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
