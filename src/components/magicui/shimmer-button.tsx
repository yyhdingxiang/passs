import { ButtonHTMLAttributes, ReactNode } from "react";

type ShimmerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function ShimmerButton({ children, className = "", ...props }: ShimmerButtonProps) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.6s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <span className="relative">{children}</span>
    </button>
  );
}
