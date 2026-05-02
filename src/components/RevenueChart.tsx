"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import type { ProcessedRevenuePoint } from "@/types/sec";

function formatYAxis(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(0)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val}`;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-zinc-400 text-xs mb-1">FY {label}</p>
      <p className="text-emerald-400 font-semibold text-sm">
        {payload[0].payload.revenueFormatted}
      </p>
    </div>
  );
}

interface RevenueChartProps {
  data: ProcessedRevenuePoint[];
  conceptName: string | null;
}

export default function RevenueChart({ data, conceptName }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-zinc-500 text-sm">No annual revenue data available.</p>
        <p className="text-zinc-600 text-xs mt-1 max-w-xs">
          This company may report revenue under a non-standard GAAP concept or
          file in a format we don&apos;t currently parse.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Annual Revenue</h3>
          <p className="text-xs text-zinc-600 mt-0.5">10-K filings only</p>
        </div>
        {conceptName && (
          <span className="text-xs text-zinc-600 font-mono bg-zinc-800 px-2 py-1 rounded">
            {conceptName}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />

          <XAxis
            dataKey="year"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={68}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#3f3f46" }} />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }}
            activeDot={{ fill: "#10b981", strokeWidth: 0, r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
