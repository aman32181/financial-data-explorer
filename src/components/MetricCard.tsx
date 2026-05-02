interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function MetricCard({ label, value, sub, accent = false }: MetricCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}
