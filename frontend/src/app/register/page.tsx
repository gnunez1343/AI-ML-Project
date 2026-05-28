"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const LICENSE_TYPES = ["LCSW", "LMFT", "PsyD", "PhD", "MD", "LPC", "LPCC", "Other"];
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    license_type: "LCSW",
    practice_name: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(BACKEND_URL + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { detail?: string }).detail ?? "Registration failed");
        return;
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created — please log in.");
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold text-ink-900">Dori.ai</span>
          </div>
          <p className="text-ink-600 text-sm">Create your clinician account</p>
        </div>

        <div className="bg-white rounded-lg border border-warm-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              name="full_name"
              type="text"
              placeholder="Dr. Maya Chen"
              value={form.full_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Work Email"
              name="email"
              type="email"
              placeholder="maya@therapypractice.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="license_type" className="text-sm font-medium text-ink-900">
                License Type
              </label>
              <select
                id="license_type"
                name="license_type"
                value={form.license_type}
                onChange={handleChange}
                className="h-9 w-full rounded-md border border-warm-200 bg-white px-3 text-sm text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2"
                required
              >
                {LICENSE_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>
            </div>

            <Input
              label="Practice Name"
              name="practice_name"
              type="text"
              placeholder="Sunrise Therapy Group"
              value={form.practice_name}
              onChange={handleChange}
              required
            />

            {error && (
              <p className="text-sm text-risk-critical bg-surface-critical rounded-md px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" isLoading={isLoading} size="lg" className="mt-2">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-600 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-sage-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
