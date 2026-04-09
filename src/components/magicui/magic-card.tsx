import { ReactNode } from "react";

type MagicCardProps = {
  children: ReactNode;
  className?: string;
};

export function MagicCard({ children, className = "" }: MagicCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-card/90 p-4 shadow-[0_14px_40px_rgba(30,64,175,0.08)] backdrop-blur ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.12),transparent_42%),radial-gradient(circle_at_85%_0%,rgba(147,51,234,0.1),transparent_34%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
