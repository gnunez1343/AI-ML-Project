"use client";

import React, { createContext, useContext } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import type { DoriUser } from "@/types/auth";

interface AuthContextValue {
  user: (DoriUser & { name?: string | null; email?: string | null }) | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const user = isAuthenticated && session?.user
    ? (session.user as unknown as DoriUser & { name?: string | null })
    : null;

  async function login(email: string, password: string): Promise<{ error?: string }> {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) return { error: "Invalid email or password" };
    return {};
  }

  async function logout(): Promise<void> {
    // Also clear backend httpOnly cookie
    try {
      await fetch("/api/proxy/auth/logout", { method: "POST" });
    } catch {
      // best-effort
    }
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
