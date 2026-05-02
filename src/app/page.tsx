"use client";

import { useCompany } from "@/context/CompanyContext";
import SearchBar from "@/components/SearchBar";
import RevenueChart from "@/components/RevenueChart";
import MetricCard from "@/components/MetricCard";
import CompanyHeader from "@/components/CompanyHeader";
import { AlertCircle, TrendingUp, BarChart3 } from "lucide-react";
import { useMemo } from "react";

function formatRevenue(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

function LoadingSkeleton() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-6 w-20 bg-zinc-800 rounded mb-3" />
            <div className="h-7 w-56 bg-zinc-800 rounded" />
          </div>
          <div className="h-4 w-28 bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="h-3 w-24 bg-zinc-800 rounded mb-3" />
            <div className="h-7 w-32 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="h-64 bg-zinc-800/50 rounded-lg" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
        <BarChart3 className="w-8 h-8 text-zinc-600" />
      </div>
      <h3 className="text-zinc-400 font-medium mb-1">Search for a company</h3>
      <p className="text-zinc-600 text-sm max-w-xs">
        Enter a US exchange ticker/Company to pull revenue data directly from SEC EDGAR filings.
      </p>
    </div>
  );
}

export default function HomePage() {
  const { company, status, error } = useCompany();

  const yoyGrowth = useMemo<number | null>(() => {
  if (!company || company.revenueData.length < 2) return null;
  const data = company.revenueData;
  const current = data[data.length - 1].revenue;
  const prior = data[data.length - 2].revenue;
  return ((current - prior) / prior) * 100;
}, [company]);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="border-b border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-semibold text-sm text-white">FinancialExplorer</span>
          </div>
          <span className="text-xs text-zinc-600">Data via SEC EDGAR</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-white mb-1">Financial Data Explorer</h1>
          <p className="text-sm text-zinc-500 mb-8">
            Public company financials sourced directly from SEC EDGAR filings.
          </p>
          <SearchBar />
        </div>

        {status === "idle" && <EmptyState />}
        {status === "loading" && <LoadingSkeleton />}

        {status === "error" && error && (
          <div className="mt-8 flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Unable to load company data</p>
              <p className="text-sm text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {status === "success" && company && (
          <div className="mt-8 space-y-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <CompanyHeader company={company} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Latest Annual Revenue"
                value={company.latestRevenue ? formatRevenue(company.latestRevenue) : "N/A"}
                sub={
                  company.revenueData.length
                    ? `FY ${company.revenueData[company.revenueData.length - 1].year}`
                    : undefined
                }
                accent
              />
              <MetricCard
                label="YoY Growth"
                value={yoyGrowth !== null ? `${yoyGrowth >= 0 ? "+" : ""}${yoyGrowth.toFixed(1)}%` : "N/A"}
                sub="vs. prior fiscal year"
              />
              <MetricCard
                label="Years of Data"
                value={String(company.revenueData.length)}
                sub="annual 10-K filings"
              />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <RevenueChart
                data={company.revenueData}
                conceptName={company.revenueConceptUsed}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
