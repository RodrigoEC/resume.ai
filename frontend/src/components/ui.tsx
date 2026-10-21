/*
  Shared UI primitives — the atoms from the spec's "Components to build" list.
  Centralising them keeps the paper-sketch look (dashed borders, near-square
  corners, offset button shadow) consistent and lets every screen stay declarative.
  All interactive controls carry visible focus rings and >=44px touch targets per
  the WCAG 2.1 AA requirement in the spec.
*/
"use client";

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** The resume.ai wordmark with the orange dot and sage highlighter swipe. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("highlight font-bold tracking-tight", className)}>
      resume<span className="text-orange">.</span>ai
    </span>
  );
}

/** Page title with the sage highlighter swipe behind it. */
export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="highlight text-[30px] font-bold leading-tight sm:text-[40px]">
      {children}
    </h1>
  );
}

/** Dashed-border card — the paper-sketch container used for every section. */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "rounded-[var(--radius-sketch)] border border-dashed border-ink bg-surface p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Olive section heading used inside cards (Personal details, Links, Skills...). */
export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-olive sm:text-2xl">{children}</h2>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sketch)] px-5 py-2 font-bold transition-[transform,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "border border-ink bg-sage text-ink sketch-shadow hover:-translate-y-px active:translate-y-px active:shadow-none disabled:hover:translate-y-0 disabled:shadow-none",
    secondary:
      "border border-ink bg-sage-tint text-ink hover:bg-sage/40 disabled:hover:bg-sage-tint",
    ghost:
      "border border-dashed border-ink/60 bg-transparent text-muted hover:border-ink hover:text-ink",
  };
  return (
    <button className={cx(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

type IconButtonTone = "neutral" | "danger";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: IconButtonTone;
}

/** Small square icon button (edit, remove, expand). `label` is the accessible name. */
export function IconButton({
  label,
  tone = "neutral",
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sketch)] border border-ink bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive",
        tone === "danger"
          ? "text-orange hover:bg-orange/10"
          : "text-ink hover:bg-sage-tint",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
}

/** Labelled text field with a dashed input and optional required asterisk. */
export function Field({
  label,
  required,
  hint,
  id,
  className,
  ...rest
}: FieldProps) {
  const inputId = id ?? `f_${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm text-muted">
        {label}
        {required && (
          <span className="text-orange" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-required={required || undefined}
        className="min-h-11 rounded-[var(--radius-sketch)] border border-dashed border-ink bg-surface px-3 py-2 text-ink placeholder:text-muted/60 focus-visible:border-solid focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive"
        {...rest}
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function TextArea({
  label,
  hint,
  id,
  className,
  rows = 4,
  ...rest
}: TextAreaProps) {
  const areaId = id ?? (label ? `t_${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={areaId} className="text-sm text-muted">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={cx(
          "resize-y rounded-[var(--radius-sketch)] border border-dashed border-ink bg-surface px-3 py-2 text-ink placeholder:text-muted/60 focus-visible:border-solid focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive",
          className,
        )}
        {...rest}
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Sage count badge with an orange dot ("3 matches", "3 drafts"). */
export function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sketch)] border border-ink bg-sage px-2.5 py-1 text-sm font-bold text-ink">
      <span
        className="h-1.5 w-1.5 rounded-full bg-orange"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/** Sage skill chip with a remove affordance. */
export function SkillChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-sketch)] border border-ink bg-sage px-3 py-1.5 text-sm text-ink">
      {label}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="rounded-full px-1 text-ink/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive"
        >
          ×
        </button>
      )}
    </span>
  );
}

/** Helper text used in the sticky footer bars ("used in the header of every resume"). */
export function FooterHint({ children }: { children: ReactNode }) {
  return <p className="text-sm italic text-muted">{children}</p>;
}
