import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardSlotProps {
  children: ReactNode;
  className?: string;
}

function CardRoot({ children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "bg-warm-50 border border-warm-200 rounded-md overflow-hidden",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = "" }: CardSlotProps) {
  return (
    <div
      className={[
        "px-6 py-4 border-b border-warm-200 bg-white",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className = "" }: CardSlotProps) {
  return (
    <div className={["px-6 py-5", className].join(" ")}>{children}</div>
  );
}

function CardFooter({ children, className = "" }: CardSlotProps) {
  return (
    <div
      className={[
        "px-6 py-3 border-t border-warm-200 bg-white",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
