"use client";

import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-700 mb-1">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select {...props} className={`${inputCls} ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles: Record<string, string> = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    secondary: "border border-neutral-200 text-neutral-700 hover:bg-neutral-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-neutral-500 hover:text-neutral-800",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

// Paste-a-URL image field with a live preview (uses a plain <img> so any host
// works — the admin app isn't subject to next/image's remote-host allowlist).
export function ImageUrlField({
  label = "Image URL",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint="Paste a hosted CDN URL. Preview updates as you type.">
      <div className="flex gap-3 items-start">
        <TextInput
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://cdn.shopify.com/…"
        />
        <div className="h-16 w-16 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-neutral-300 text-xs">
              none
            </div>
          )}
        </div>
      </div>
    </Field>
  );
}

// Simple modal/slide-over used by the editors.
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <header className="sticky top-0 bg-white border-b border-neutral-100 px-5 h-14 flex items-center justify-between z-10">
          <h2 className="font-bold text-neutral-900">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-2xl leading-none">
            ×
          </button>
        </header>
        <div className="flex-1 p-5 space-y-4">{children}</div>
        {footer && (
          <footer className="sticky bottom-0 bg-white border-t border-neutral-100 px-5 py-3 flex justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
