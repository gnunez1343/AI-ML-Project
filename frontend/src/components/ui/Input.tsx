import type { InputHTMLAttributes } from "react";

export type InputVariant = "default" | "error";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  variant?: InputVariant;
}

export function Input({
  label,
  helperText,
  errorText,
  variant = "default",
  id,
  className = "",
  ...props
}: InputProps) {
  const hasError = variant === "error" || Boolean(errorText);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-900"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "h-9 w-full rounded-md border bg-white px-3 text-sm text-ink-900",
          "placeholder:text-ink-400",
          "transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          hasError
            ? "border-risk-critical focus-visible:ring-risk-critical"
            : "border-warm-200 focus-visible:ring-sage-600",
          className,
        ].join(" ")}
        {...props}
      />
      {hasError && errorText && (
        <p className="text-xs text-risk-critical" role="alert">
          {errorText}
        </p>
      )}
      {!hasError && helperText && (
        <p className="text-xs text-ink-400">{helperText}</p>
      )}
    </div>
  );
}
