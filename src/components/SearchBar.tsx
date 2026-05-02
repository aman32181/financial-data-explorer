"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useCompany } from "@/context/CompanyContext";
import { Search, X, Loader2 } from "lucide-react";
import type { SecTickerEntry, SecTickerMap } from "@/types/sec";

const EXAMPLES = ["APPLE", "MICROSOFT", "NVIDIA", "JPMORGAN CHASE", "TESLA"];

export default function SearchBar() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<SecTickerEntry[]>([]);
  const [tickerList, setTickerList] = useState<SecTickerEntry[]>([]);
  const [loadingTickers, setLoadingTickers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { fetchCompany, status, reset } = useCompany();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "loading";

  useEffect(() => {
    async function loadTickers() {
      setLoadingTickers(true);
      try {
        const res = await fetch(
          `/api/sec?endpoint=${encodeURIComponent("/files/company_tickers.json")}`
        );
        const data: SecTickerMap = await res.json();
        setTickerList(Object.values(data));
      } catch {
      } finally {
        setLoadingTickers(false);
      }
    }
    loadTickers();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(value: string) {
    setInput(value);
    setActiveIndex(-1);

    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const lower = value.toLowerCase();
    const isAllDigits = /^\d+$/.test(value.trim());

    const matches = tickerList
      .filter((e) => {
        if (isAllDigits) {
          return String(e.cik_str).startsWith(value.trim());
        }
        return (
          e.ticker.toLowerCase().startsWith(lower) ||
          e.title.toLowerCase().includes(lower)
        );
      })
      .slice(0, 8);

    setSuggestions(matches);
    setShowDropdown(matches.length > 0);
  }

  function selectSuggestion(entry: SecTickerEntry) {
    setInput(entry.title);
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    fetchCompany(entry.ticker);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setShowDropdown(false);
    fetchCompany(input);
  }

  function handleClear() {
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    reset();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {loadingTickers ? (
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-zinc-400" />
          )}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search by company name, ticker, or CIK..."
          disabled={isLoading}
          autoComplete="off"
          className="w-full bg-zinc-900 border border-zinc-700/60 rounded-xl pl-12 pr-28 py-4
                     text-white placeholder-zinc-500 text-sm
                     focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20
                     transition-all duration-200 disabled:opacity-50"
        />

        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700
                       disabled:text-zinc-500 text-white text-sm font-medium rounded-lg
                       transition-colors duration-150"
          >
            {isLoading ? "Loading..." : "Search"}
          </button>
        </div>

        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700/60
                         rounded-xl overflow-hidden shadow-2xl shadow-black/40">
            {suggestions.map((entry, i) => (
              <li key={entry.cik_str}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(entry);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left
                              transition-colors duration-100
                              ${i === activeIndex
                                ? "bg-zinc-700 text-white"
                                : "hover:bg-zinc-800 text-zinc-200"
                              }
                              ${i !== suggestions.length - 1 ? "border-b border-zinc-800" : ""}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10
                                     border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                      {entry.ticker}
                    </span>
                    <span className="text-sm truncate">{entry.title}</span>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono shrink-0 ml-3">
                    {entry.cik_str}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-600">Try:</span>
        {EXAMPLES.map((ticker) => (
          <button
            key={ticker}
            onClick={() => {
              setInput(ticker);
              fetchCompany(ticker);
            }}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400
                       hover:bg-zinc-700 hover:text-zinc-200 font-mono transition-colors
                       disabled:opacity-40"
          >
            {ticker}
          </button>
        ))}
      </div>
    </div>
  );
}