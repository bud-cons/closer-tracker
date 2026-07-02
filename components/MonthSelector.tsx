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
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none [color-scheme:dark] focus:border-slate-500 disabled:bg-slate-800"
      />
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
          value === ""
            ? "bg-blue-600 text-white"
            : "border border-slate-700 text-slate-300 hover:bg-slate-800"
        }`}
      >
        All Time
      </button>
    </div>
  );
}
