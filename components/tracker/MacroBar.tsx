const CRITICAL = "#e66767";

type Props = {
  label: string;
  unit: string;
  consumed: number;
  target: number;
  color: string;
  isFloor?: boolean; // true = target is a minimum (protein), false = target is a ceiling
};

export default function MacroBar({ label, unit, consumed, target, color, isFloor }: Props) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const over = !isFloor && consumed > target;
  const met = isFloor && consumed >= target;
  const remaining = Math.round(target - consumed);
  const barColor = over ? CRITICAL : met ? "#0ca30c" : color;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="text-slate-400">
          <span className="font-medium text-white">{Math.round(consumed)}</span> / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {isFloor
          ? met
            ? "Goal met"
            : `${Math.max(0, remaining)}${unit} to go`
          : over
            ? `${Math.abs(remaining)}${unit} over`
            : `${remaining}${unit} left`}
      </div>
    </div>
  );
}
