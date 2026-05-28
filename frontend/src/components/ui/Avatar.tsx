export type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  initials: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs",   // 32px
  md: "w-10 h-10 text-sm", // 40px
  lg: "w-12 h-12 text-base", // 48px
};

export function Avatar({
  initials,
  size = "md",
  className = "",
}: AvatarProps) {
  // Show max 2 characters
  const display = initials.slice(0, 2).toUpperCase();

  return (
    <div
      aria-label={`Avatar: ${initials}`}
      className={[
        "inline-flex items-center justify-center rounded-full",
        "bg-sage-600 text-white font-semibold select-none shrink-0",
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      {display}
    </div>
  );
}
