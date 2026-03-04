"use client";

type Props = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
};

export function Checkbox({ id, checked, onChange, label, className = "" }: Props) {
  const uid = id ?? `cb-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <label
      htmlFor={uid}
      className={`group inline-flex cursor-pointer items-center gap-3 text-sm text-white transition hover:text-white/90 ${className}`}
    >
      <input
        id={uid}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-white/20 bg-white/5 transition group-hover:border-white/30 peer-checked:border-indigo-400 peer-checked:bg-gradient-to-br peer-checked:from-indigo-500 peer-checked:to-purple-600 peer-checked:shadow-[0_0_12px_rgba(99,102,241,0.4)]"
      >
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
