"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /dashboard/sessions redirects to /dashboard (sessions list lives there)
export default function SessionsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
