"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import type {
  CompanyData,
  CompanyFacts,
  FinancialDataPoint,
  ProcessedRevenuePoint,
  SecTickerMap,
} from "@/types/sec";

const REVENUE_CONCEPTS = [
  "Revenues",
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
  "SalesRevenueNet",
  "SalesRevenueGoodsNet",
  "RevenuesNetOfInterestExpense",
];

function formatRevenue(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

async function secFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`/api/sec?endpoint=${encodeURIComponent(endpoint)}`);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data as T;
}
function extractAnnualRevenue(
  dataPoints: FinancialDataPoint[]
): ProcessedRevenuePoint[] {
  const annualOnly = dataPoints.filter((d) => d.form === "10-K");

  const byYear = new Map<string, FinancialDataPoint>();
  for (const point of annualOnly) {
    const existing = byYear.get(point.end);
    if (!existing || point.filed > existing.filed) {
      byYear.set(point.end, point);
    }
  }

  return Array.from(byYear.values())
    .sort((a, b) => a.end.localeCompare(b.end))
    .map((d) => ({
      year: new Date(d.end).getFullYear(),
      revenue: d.val,
      revenueFormatted: formatRevenue(d.val),
    }));
}

type FetchState = "idle" | "loading" | "error" | "success";

interface CompanyContextValue {
  company: CompanyData | null;
  status: FetchState;
  error: string | null;
  fetchCompany: (ticker: string) => Promise<void>;
  reset: () => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [status, setStatus] = useState<FetchState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCompany(null);
    setStatus("idle");
    setError(null);
  }, []);

  const fetchCompany = useCallback(async (rawInput: string) => {
    const input = rawInput.trim();
    if (!input) return;

    setStatus("loading");
    setError(null);
    setCompany(null);

    try {
      const tickerMap = await secFetch<SecTickerMap>("/files/company_tickers.json");
      const entries = Object.values(tickerMap);

      let entry;

      if (/^\d+$/.test(input)) {
        const cikNum = parseInt(input, 10);
        entry = entries.find((e) => e.cik_str === cikNum);
        if (!entry) throw new Error(`No company found with CIK "${input}".`);
      } else {
        entry =
          entries.find((e) => e.ticker.toUpperCase() === input.toUpperCase()) ??
          entries.find((e) =>
            e.title.toLowerCase().includes(input.toLowerCase())
          );

        if (!entry) {
          throw new Error(
            `No company found matching "${input}". Try a ticker (AAPL), CIK (320193), or a more specific name.`
          );
        }
      }
      const ticker = entry.ticker.toUpperCase();
      const paddedCik = String(entry.cik_str).padStart(10, "0");
      const facts = await secFetch<{
        entityName: string;
        revenueData: ProcessedRevenuePoint[];
        revenueConceptUsed: string | null;
      }>(`/api/xbrl/companyfacts/CIK${paddedCik}.json`);

      if (!facts?.entityName) {
        throw new Error("EDGAR returned an unexpected response. Try again in a moment.");
      }

      const revenueData = facts.revenueData;
      const revenueConceptUsed = facts.revenueConceptUsed;
      const latestRevenue = revenueData.length
        ? revenueData[revenueData.length - 1].revenue
        : null;

      setCompany({
        cik: entry.cik_str,
        name: facts.entityName,
        ticker,
        revenueData,
        latestRevenue,
        revenueConceptUsed,
      });
      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
    }
  }, []);

  return (
    <CompanyContext.Provider value={{ company, status, error, fetchCompany, reset }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}
