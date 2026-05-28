import type { ReactNode } from "react";

interface ShellLayoutProps {
  children: ReactNode;
}

/**
 * Responsive shell layout — sidebar nav + main content area.
 * Sidebar collapses to a top bar on mobile.
 */
export function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-warm-200 h-14 flex items-center px-6">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <div className="w-7 h-7 rounded-md bg-sage-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">D</span>
          </div>
          <span className="text-sm font-semibold text-ink-900 tracking-tight">
            Dori.ai
          </span>
        </div>
        <nav className="ml-8 hidden md:flex items-center gap-1">
          <NavItem label="Dashboard" active />
          <NavItem label="Sessions" />
          <NavItem label="Notes" />
          <NavItem label="Clients" />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-ink-600 hidden sm:block">
            Dr. Rivera
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

interface NavItemProps {
  label: string;
  active?: boolean;
}

function NavItem({ label, active }: NavItemProps) {
  return (
    <a
      href="#"
      className={[
        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-sage-50 text-sage-900"
          : "text-ink-600 hover:bg-warm-100 hover:text-ink-900",
      ].join(" ")}
    >
      {label}
    </a>
  );
}
