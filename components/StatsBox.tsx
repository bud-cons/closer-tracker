type Row = { label: string; value: string };

export default function StatsBox({
  title,
  rows,
  headerRight,
}: {
  title: string;
  rows: Row[];
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{title}</h3>
        {headerRight}
      </div>
      <dl className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <dt className="text-slate-400">{row.label}</dt>
            <dd className="font-medium text-white">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
