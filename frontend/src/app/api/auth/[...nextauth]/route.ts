import NextAuth, { type NextAuthOptions, type User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { DoriUser } from "@/types/auth";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials.password) return null;
        try {
          const res = await fetch(BACKEND_URL + "/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          if (!res.ok) return null;
          const user: DoriUser = await res.json();
          // Return profile only — auth token in httpOnly cookie (HIPAA)
          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            // Extra fields stored in JWT only
            full_name: user.full_name,
            license_type: user.license_type,
            practice_name: user.practice_name,
            role: user.role,
          } as NextAuthUser;
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as NextAuthUser & Partial<DoriUser>;
        token.id = u.id;
        token.full_name = u.full_name ?? "";
        token.license_type = u.license_type ?? "";
        token.practice_name = u.practice_name ?? "";
        token.role = u.role ?? "clinician";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as typeof session.user & Partial<DoriUser> & { id?: string };
        u.id = token.id as string;
        u.full_name = token.full_name as string;
        u.license_type = token.license_type as string;
        u.practice_name = token.practice_name as string;
        u.role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
