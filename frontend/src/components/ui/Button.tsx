import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-sage-900 text-white hover:bg-sage-800 active:bg-sage-900 border border-transparent",
  secondary:
    "bg-white text-sage-900 border border-sage-900 hover:bg-sage-50 active:bg-sage-100",
  ghost:
    "bg-transparent text-ink-600 border border-transparent hover:bg-warm-100 hover:text-ink-900 active:bg-warm-200",
  danger:
    "bg-risk-critical text-white hover:bg-red-700 active:bg-red-800 border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-sm",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-11 px-6 text-sm rounded-md",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-3.5 w-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
