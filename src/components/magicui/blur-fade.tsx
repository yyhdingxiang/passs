import { ReactNode } from "react";

type BlurFadeProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

export function BlurFade({ children, className = "", delayMs = 0 }: BlurFadeProps) {
  return (
    <div
      className={`animate-[fadeUp_.55s_ease-out_both] ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
