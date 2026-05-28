import type { ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-sage-100 text-sage-900",
  warning: "bg-surface-warning text-risk-high",
  error: "bg-surface-critical text-risk-critical",
  info: "bg-surface-info text-risk-low",
  neutral: "bg-warm-100 text-ink-600",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
