import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-sidebar-2 disabled:bg-ink/40",
  secondary: "border border-line bg-paper-2 text-ink hover:border-ink/30 disabled:opacity-50",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink disabled:opacity-50",
  danger: "border border-clay/30 bg-clay-soft text-clay hover:border-clay disabled:opacity-50",
};

export const Button = ({ variant = "primary", className, type = "button", ...props }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition disabled:cursor-not-allowed",
      variants[variant],
      className,
    )}
    {...props}
  />
);
