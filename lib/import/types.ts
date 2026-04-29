export type TransactionType =
  | "ingreso"
  | "egreso"
  | "ahorro"
  | "transferencia";

export type TransactionCurrency = "ARS" | "USD";

export interface ColumnMapping {
  source: string;
  date: string;
  amount: string;
  type: string | null;
  person: string | null;
  category: string | null;
  subcategory: string | null;
  concept: string | null;
  payment_method: string | null;
  notes: string | null;
  typeMap?: Record<string, TransactionType>;
  dateFormat?: string;
  amountLocale?: "AR" | "US" | "auto";
  defaultCurrency?: TransactionCurrency;
}

export interface NormalizedTransaction {
  external_id: string;
  source: string;
  date: string;
  amount: number;
  currency: TransactionCurrency;
  type: TransactionType | null;
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

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
  type: TransactionType;
  is_business: boolean;
}

export interface ProfileRef {
  id: string;
  display_name: string;
  telegram_username: string | null;
}

export interface ClassifyContext {
  promptTemplate: string;
  categories: CategoryRef[];
  profiles: ProfileRef[];
  lastMessages: string[];
  currentProfileName: string;
  apiKey: string;
  model?: string;
}
