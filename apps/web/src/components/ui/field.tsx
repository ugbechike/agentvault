import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Field = ({ label, htmlFor, error, hint, children }: FieldProps) => (
  <label htmlFor={htmlFor} className="block space-y-1.5">
    <span className="text-sm font-medium text-ink">{label}</span>
    {children}
    {error ? <span className="block text-sm text-clay">{error}</span> : null}
    {hint && !error ? <span className="block text-sm text-ink-soft">{hint}</span> : null}
  </label>
);

const controlClass =
  "w-full rounded-2xl border border-line bg-paper-2 px-3 py-2.5 text-sm text-ink outline-none ring-copper/40 placeholder:text-ink-soft/70 focus:ring-2";

export const TextInput = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(controlClass, className)} {...props} />
);

export const TextArea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn(controlClass, "min-h-24 resize-y", className)} {...props} />
);

export const SelectInput = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn(controlClass, className)} {...props} />
);
