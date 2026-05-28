"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutList,
  Users,
  FileText,
  Settings,
  LogOut,
  Brain,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { DoriUser } from "@/types/auth";

const NAV_ITEMS = [
  { label: "Sessions",  href: "/dashboard",          icon: LayoutList },
  { label: "Patients",  href: "/dashboard/patients",  icon: Users },
  { label: "Notes",     href: "/dashboard/notes",     icon: FileText },
  { label: "Settings",  href: "/dashboard/settings",  icon: Settings },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: typeof NAV_ITEMS[0];
  pathname: string;
  onClick?: () => void;
}) {
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={[
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-sage-100 text-sage-900"
          : "text-ink-600 hover:bg-warm-100 hover:text-ink-900",
      ].join(" ")}
    >
      <item.icon size={18} />
      {item.label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const user = session?.user as unknown as DoriUser | undefined;
  const initials = user?.full_name ? getInitials(user.full_name) : "??";
  const practiceName = user?.practice_name ?? "Practice";
  const displayName = user?.full_name ?? "Clinician";

  async function handleLogout() {
    try {
      await fetch(
        (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000") + "/api/auth/logout",
        { method: "POST", credentials: "include" }
      );
    } catch {
      // best-effort
    }
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-warm-200 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-5 border-b border-warm-200">
          <Brain size={22} className="text-sage-700" />
          <span className="font-bold text-ink-900 text-base">Dori.ai</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-warm-200">
          <div className="flex items-center gap-3 px-2 mb-3">
            <Avatar initials={initials} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">{displayName}</p>
              <p className="text-xs text-ink-400 truncate">{practiceName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-600 hover:bg-warm-100 hover:text-ink-900 rounded-md transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile: shows brand + avatar; desktop: shows practice name + avatar) */}
        <header className="bg-white border-b border-warm-200 px-4 h-14 flex items-center justify-between shrink-0">
          {/* Mobile: brand */}
          <div className="flex items-center gap-2 md:hidden">
            <Brain size={20} className="text-sage-700" />
            <span className="font-bold text-ink-900">Dori.ai</span>
          </div>
          {/* Desktop: practice name */}
          <span className="hidden md:block text-sm font-medium text-ink-600">{practiceName}</span>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
            <Avatar initials={initials} size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tabs (md: hidden) ──────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-warm-200 flex z-50">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive ? "text-sage-700" : "text-ink-400 hover:text-ink-700",
              ].join(" ")}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
