import { ButtonHTMLAttributes, ReactNode } from "react";

type ShimmerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function ShimmerButton({ children, className = "", ...props }: ShimmerButtonProps) {
  return (
    <button
      {...props}
      className={`relative overflow-hidden rounded-xl border border-blue-500 bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <span className="relative">{children}</span>
    </button>
  );
}
