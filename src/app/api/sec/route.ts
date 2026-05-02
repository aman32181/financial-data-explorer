import { NextRequest, NextResponse } from "next/server";

const SEC_BASE = "https://data.sec.gov";
const SEC_WWW_BASE = "https://www.sec.gov";

const USER_AGENT =
  process.env.SEC_USER_AGENT ?? "FinancialExplorer contact@example.com";

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    if (res.status === 429) {
      return NextResponse.json(
        { error: "SEC EDGAR is rate-limiting requests. Wait a moment and try again." },
        { status: 429 }
      );
    }

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Company not found on SEC EDGAR." },
        { status: 404 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `EDGAR returned an unexpected error (${res.status}).` },
        { status: res.status }
      );
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json(
        { error: "SEC EDGAR returned a non-JSON response." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Request to SEC EDGAR timed out." },
        { status: 504 }
      );
    }
    console.error("[sec-proxy] fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to reach SEC EDGAR. Check your connection." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}