import { cn } from "@/lib/cn";

export const StepTracker = ({ steps, current }: { steps: readonly string[]; current: number }) => (
  <ol className="grid gap-2 sm:grid-cols-3">
    {steps.map((step, index) => (
      <li
        key={step}
        className={cn(
          "rounded-2xl border px-3 py-2 text-xs",
          index === current ? "border-ink bg-ink text-paper" : "border-line text-ink-soft",
        )}
      >
        {index + 1}. {step}
      </li>
    ))}
  </ol>
);
