export interface SecTickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

export interface SecTickerMap {
  [key: string]: SecTickerEntry;
}

export interface FinancialDataPoint {
  end: string;       
  val: number;
  form: string;      
  accn: string;      
  fy: number;
  fp: string;        
  filed: string;
}

export interface ConceptUnit {
  USD: FinancialDataPoint[];
}

export interface FinancialConcept {
  label: string;
  description: string;
  units: ConceptUnit;
}

export interface CompanyFacts {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap": {
      [conceptName: string]: FinancialConcept;
    };
  };
}

export interface ProcessedRevenuePoint {
  year: number;
  revenue: number;
  revenueFormatted: string;
}

export interface CompanyData {
  cik: number;
  name: string;
  ticker: string;
  revenueData: ProcessedRevenuePoint[];
  latestRevenue: number | null;
  revenueConceptUsed: string | null;
}
