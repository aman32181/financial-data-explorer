import type { CompanyData } from "@/types/sec";
import { ExternalLink } from "lucide-react";

export default function CompanyHeader({ company }: { company: CompanyData }) {
  const edgarUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.cik}&type=10-K&dateb=&owner=include&count=10`;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
            {company.ticker}
          </span>
          <span className="text-xs text-zinc-600">CIK: {company.cik}</span>
        </div>
        <h2 className="text-xl font-semibold text-white">{company.name}</h2>
      </div>

      <a
        href={edgarUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 
                   transition-colors shrink-0 mt-1"
      >
        View on EDGAR
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
