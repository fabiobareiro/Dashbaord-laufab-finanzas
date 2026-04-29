export type TransactionType =
  | "ingreso"
  | "egreso"
  | "ahorro"
  | "transferencia";

export type TransactionCurrency = "ARS" | "USD";

export interface ColumnMapping {
  date: string;
  amount: string;
  type: string | null;
  person: string | null;
  category: string | null;
  subcategory: string | null;
  concept: string | null;
  payment_method: string | null;
  notes: string | null;
}

export interface NormalizedTransaction {
  external_id: string;
  source: string;
  date: string;
  amount: number;
  currency: TransactionCurrency;
  type: TransactionType;
  person: string | null;
  category: string | null;
  subcategory: string | null;
  concept: string | null;
  payment_method: string | null;
  notes: string | null;
  raw_input: Record<string, string | number | null>;
  row_index: number;
}

export interface SuggestedCategory {
  name: string;
  reason: string;
}

export interface ClassificationResult {
  category_id: string | null;
  suggest_new_category: SuggestedCategory | null;
  ai_confidence: number;
  ai_reasoning: string;
  needs_review: boolean;
  is_business: boolean;
  concept: string;
  payment_method: string | null;
  type_confirmed: TransactionType;
}
