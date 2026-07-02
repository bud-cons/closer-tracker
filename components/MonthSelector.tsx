"use client";

type Props = {
  value: string; // "" means All Time, otherwise "YYYY-MM"
  onChange: (value: string) => void;
};

export default function MonthSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="month"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
      />
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
          value === ""
            ? "bg-slate-900 text-white"
            : "border border-slate-300 text-slate-600 hover:bg-slate-50"
        }`}
      >
        All Time
      </button>
    </div>
  );
}
