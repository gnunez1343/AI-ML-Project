"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold text-ink-900">Dori.ai</span>
          </div>
          <p className="text-ink-600 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg border border-warm-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="maya@therapypractice.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-risk-critical bg-surface-critical rounded-md px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" isLoading={isLoading} size="lg" className="mt-2">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-600 mt-4">
          New to Dori.ai?{" "}
          <Link href="/register" className="text-sage-700 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
