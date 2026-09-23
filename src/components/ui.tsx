import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "li";
}) {
  return (
    <Tag
      className={cx(
        "rounded-2xl border border-border bg-surface p-4 shadow-sm",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted",
  ghost: "text-foreground hover:bg-surface-muted",
  danger: "bg-danger text-white hover:opacity-90",
} as const;

export type ButtonVariant = keyof typeof variants;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={cx(buttonBase, variants[variant], className)}
    />
  );
}

export function LinkButton({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link {...props} className={cx(buttonBase, variants[variant], className)} />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(controlClass, className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(controlClass, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(controlClass, className)} />;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "warn";
}) {
  const tones = {
    neutral: "bg-surface-muted text-muted",
    brand: "bg-brand/15 text-brand",
    warn: "bg-accent/15 text-accent",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  color = "var(--brand)",
}: {
  value: number;
  max: number;
  label?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{label}</span>
          <span>
            {Math.round(value)} / {Math.round(max)}
          </span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "progress"}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function Ring({
  value,
  max,
  size = 132,
  stroke = 12,
  caption,
  sub,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  caption: string;
  sub?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`${caption}: ${Math.round(value)} of ${Math.round(max)}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          className="fill-foreground text-xl font-semibold"
          style={{ fontSize: 22 }}
        >
          {Math.round(value)}
        </text>
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          className="fill-current"
          style={{ fontSize: 12, fill: "var(--muted)" }}
        >
          {sub ?? `of ${Math.round(max)}`}
        </text>
      </svg>
      <p className="mt-1 text-sm font-medium">{caption}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={cx("text-xs text-muted", compact ? "" : "leading-relaxed")}>
      These numbers are estimates based on formulas and averages, not medical
      advice. Individual needs vary. Speak with a qualified healthcare
      professional before making significant changes, especially if you are
      pregnant, under 18, managing a medical condition, or have a history of
      disordered eating.
    </p>
  );
}
