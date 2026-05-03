import { NextRequest, NextResponse } from "next/server";

const SEC_BASE = "https://data.sec.gov";
const SEC_WWW_BASE = "https://www.sec.gov";
const USER_AGENT = process.env.SEC_USER_AGENT ?? "FinancialExplorer contact@example.com";

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

function extractAnnualRevenue(dataPoints: any[]) {
  const annualOnly = dataPoints.filter((d) => d.form === "10-K");
  const byYear = new Map<string, any>();
  for (const point of annualOnly) {
    const existing = byYear.get(point.end);
    if (!existing || point.filed > existing.filed) byYear.set(point.end, point);
  }
  return Array.from(byYear.values())
    .sort((a, b) => a.end.localeCompare(b.end))
    .map((d) => ({
      year: new Date(d.end).getFullYear(),
      revenue: d.val,
      revenueFormatted: formatRevenue(d.val),
    }));
}

async function secFetch(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000); 
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) throw { status: res.status };
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 });
  }

  let normalizedEndpoint: string;
  try {
    normalizedEndpoint = new URL(endpoint, "https://dummy.local").pathname;
  } catch {
    return NextResponse.json({ error: "Invalid endpoint parameter" }, { status: 400 });
  }

  const isDataEndpoint = normalizedEndpoint.startsWith("/api/xbrl/");
  const isWwwEndpoint = normalizedEndpoint.startsWith("/files/");

  if (!isDataEndpoint && !isWwwEndpoint) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 403 });
  }

  const base = isWwwEndpoint ? SEC_WWW_BASE : SEC_BASE;
  const url = `${base}${normalizedEndpoint}`;

  try {
    const data = await secFetch(url);

    if (isWwwEndpoint) {
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
      });
    }

    if (normalizedEndpoint.startsWith("/api/xbrl/companyfacts/")) {
      if (!data?.facts) {
        return NextResponse.json(
          { error: "EDGAR returned an unexpected response." },
          { status: 502 }
        );
      }

      const gaap = data.facts["us-gaap"] ?? {};
      let revenueData: any[] = [];
      let revenueConceptUsed: string | null = null;

      for (const concept of REVENUE_CONCEPTS) {
        if (gaap[concept]?.units?.USD?.length) {
          revenueData = extractAnnualRevenue(gaap[concept].units.USD);
          revenueConceptUsed = concept;
          break;
        }
      }

      return NextResponse.json(
        {
          entityName: data.entityName,
          revenueData,
          revenueConceptUsed,
        },
        {
          headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" },
        }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Request to SEC EDGAR timed out." }, { status: 504 });
    }
    if (err?.status === 429) {
      return NextResponse.json(
        { error: "SEC EDGAR is rate-limiting requests. Wait a moment and try again." },
        { status: 429 }
      );
    }
    if (err?.status === 404) {
      return NextResponse.json({ error: "Company not found on SEC EDGAR." }, { status: 404 });
    }
    console.error("[sec-proxy] fetch failed:", err);
    return NextResponse.json({ error: "Failed to reach SEC EDGAR." }, { status: 502 });
  }
}