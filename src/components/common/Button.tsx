import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[var(--color-ink)] text-white",
  secondary: "border-2 border-[var(--color-ink)] text-[var(--color-ink)] bg-transparent",
  ghost: "bg-gray-100 text-[var(--color-ink)]",
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 w-full rounded-xl px-6 py-3 font-semibold transition-opacity disabled:opacity-40",
        VARIANT_CLASS[variant],
        className
      )}
      {...props}
    />
  );
}
