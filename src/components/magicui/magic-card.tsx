import { ReactNode } from "react";

type MagicCardProps = {
  children: ReactNode;
  className?: string;
};

export function MagicCard({ children, className = "" }: MagicCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
