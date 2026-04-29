import type {
  ClassificationResult,
  ClassifyContext,
  NormalizedTransaction,
  TransactionType,
} from "./types.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
const VALID_TRANSACTION_TYPES: TransactionType[] = [
  "ingreso",
  "egreso",
  "ahorro",
  "transferencia",
];

interface OpenRouterUsage {
  total_tokens?: number;
  cost?: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: OpenRouterUsage;
}

interface LlmClassificationPayload {
  type: TransactionType;
  amount: number;
  currency: string;
  category_slug: string | null;
  suggest_new_category: string | null;
  concept: string;
  payment_method: string | null;
  is_business: boolean;
  notes: string | null;
  ai_confidence: number;
  ai_reasoning: string;
  needs_review: boolean;
}

class RetryableRequestError extends Error {}

export const classifyStats = {
  totalCalls: 0,
  totalTokens: 0,
  totalCostUsd: 0,
};

export function resetClassifyStats(): void {
  classifyStats.totalCalls = 0;
  classifyStats.totalTokens = 0;
  classifyStats.totalCostUsd = 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTransactionType(value: string): value is TransactionType {
  return VALID_TRANSACTION_TYPES.includes(value as TransactionType);
}

function buildUserMessage(tx: NormalizedTransaction): string {
  const segments = [`[Fila de ${tx.source}]`];

  if (tx.person) {
    segments.push(`Persona: ${tx.person}`);
  }

  segments.push(`Fecha: ${tx.date.slice(0, 10)}`);

  if (tx.type) {
    segments.push(`Tipo: ${tx.type}`);
  }

  segments.push(`Monto: ${tx.amount} ${tx.currency}`);

  if (tx.category) {
    segments.push(`Categoria origen: ${tx.category}`);
  }

  if (tx.subcategory) {
    segments.push(`Subcat: ${tx.subcategory}`);
  }

  if (tx.concept) {
    segments.push(`Concepto: ${tx.concept}`);
  }

  if (tx.payment_method) {
    segments.push(`Medio: ${tx.payment_method}`);
  }

  if (tx.notes) {
    segments.push(`Notas: ${tx.notes}`);
  }

  return segments.join(" | ");
}

function buildFinalPrompt(tx: NormalizedTransaction, ctx: ClassifyContext): string {
  const categoriesJson = JSON.stringify(
    ctx.categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      type: category.type,
      is_business: category.is_business,
    })),
    null,
    2,
  );

  const profilesJson = JSON.stringify(
    ctx.profiles.map((profile) => ({
      name: profile.display_name,
      telegram: profile.telegram_username,
    })),
    null,
    2,
  );

  return ctx.promptTemplate
    .replaceAll("{{categories_json}}", categoriesJson)
    .replaceAll("{{profiles_json}}", profilesJson)
    .replaceAll("{{last_messages}}", ctx.lastMessages.join("\n"))
    .replaceAll("{{persona_actual}}", ctx.currentProfileName)
    .replaceAll("{{user_message}}", buildUserMessage(tx));
}

function extractContent(data: OpenRouterResponse): string {
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("OpenRouter response missing message content");
  }

  return content;
}

function parseLlmPayload(content: string): LlmClassificationPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${content.slice(0, 200)}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("LLM returned invalid payload shape");
  }

  const payload = parsed as Partial<LlmClassificationPayload>;

  if (typeof payload.type !== "string" || !isTransactionType(payload.type)) {
    throw new Error(`LLM returned invalid transaction type: ${String(payload.type)}`);
  }

  if (typeof payload.ai_confidence !== "number") {
    throw new Error("LLM returned invalid ai_confidence");
  }

  if (typeof payload.ai_reasoning !== "string") {
    throw new Error("LLM returned invalid ai_reasoning");
  }

  if (typeof payload.needs_review !== "boolean") {
    throw new Error("LLM returned invalid needs_review");
  }

  if (typeof payload.is_business !== "boolean") {
    throw new Error("LLM returned invalid is_business");
  }

  if (typeof payload.concept !== "string") {
    throw new Error("LLM returned invalid concept");
  }

  if (
    payload.payment_method !== null &&
    payload.payment_method !== undefined &&
    typeof payload.payment_method !== "string"
  ) {
    throw new Error("LLM returned invalid payment_method");
  }

  if (
    payload.category_slug !== null &&
    payload.category_slug !== undefined &&
    typeof payload.category_slug !== "string"
  ) {
    throw new Error("LLM returned invalid category_slug");
  }

  if (
    payload.suggest_new_category !== null &&
    payload.suggest_new_category !== undefined &&
    typeof payload.suggest_new_category !== "string"
  ) {
    throw new Error("LLM returned invalid suggest_new_category");
  }

  return {
    type: payload.type,
    amount: typeof payload.amount === "number" ? payload.amount : 0,
    currency: typeof payload.currency === "string" ? payload.currency : "",
    category_slug: payload.category_slug ?? null,
    suggest_new_category: payload.suggest_new_category ?? null,
    concept: payload.concept,
    payment_method: payload.payment_method ?? null,
    is_business: payload.is_business,
    notes: payload.notes ?? null,
    ai_confidence: payload.ai_confidence,
    ai_reasoning: payload.ai_reasoning,
    needs_review: payload.needs_review,
  };
}

async function requestClassification(finalPrompt: string, ctx: ClassifyContext): Promise<OpenRouterResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://saldito.app",
        "X-Title": "Saldito Import",
      },
      body: JSON.stringify({
        model: ctx.model ?? DEFAULT_MODEL,
        messages: [{ role: "user", content: finalPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();

    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        throw new RetryableRequestError(
          `OpenRouter request failed with status ${response.status}: ${responseText.slice(0, 200)}`,
        );
      }

      throw new Error(
        `OpenRouter request failed with status ${response.status}: ${responseText.slice(0, 200)}`,
      );
    }

    return JSON.parse(responseText) as OpenRouterResponse;
  } catch (error) {
    if (error instanceof RetryableRequestError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new RetryableRequestError("OpenRouter request timed out after 30000ms");
    }

    if (error instanceof SyntaxError) {
      throw new Error(`OpenRouter returned invalid response JSON: ${error.message}`);
    }

    if (error instanceof TypeError) {
      throw new RetryableRequestError(`OpenRouter network error: ${error.message}`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function accumulateStats(usage?: OpenRouterUsage): void {
  classifyStats.totalCalls += 1;
  classifyStats.totalTokens += usage?.total_tokens ?? 0;

  const parsedCost = Number.parseFloat(usage?.cost ?? "0");
  classifyStats.totalCostUsd += Number.isNaN(parsedCost) ? 0 : parsedCost;
}

export async function classify(
  tx: NormalizedTransaction,
  ctx: ClassifyContext,
): Promise<ClassificationResult> {
  const finalPrompt = buildFinalPrompt(tx, ctx);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const data = await requestClassification(finalPrompt, ctx);
      const content = extractContent(data);
      const payload = parseLlmPayload(content);
      const matchedCategory = payload.category_slug
        ? ctx.categories.find((category) => category.slug === payload.category_slug) ?? null
        : null;

      let aiReasoning = payload.ai_reasoning;
      let needsReview = payload.needs_review;

      if (payload.category_slug && !matchedCategory) {
        aiReasoning = aiReasoning
          ? `${aiReasoning} [slug "${payload.category_slug}" no encontrado en categorias]`
          : `[slug "${payload.category_slug}" no encontrado en categorias]`;
        needsReview = true;
      }

      accumulateStats(data.usage);

      return {
        category_id: matchedCategory?.id ?? null,
        suggest_new_category: payload.suggest_new_category
          ? {
              name: payload.suggest_new_category,
              reason: aiReasoning,
            }
          : null,
        ai_confidence: payload.ai_confidence,
        ai_reasoning: aiReasoning,
        needs_review: needsReview,
        is_business: payload.is_business,
        concept: payload.concept,
        payment_method: payload.payment_method,
        type_confirmed: payload.type,
      };
    } catch (error) {
      if (!(error instanceof RetryableRequestError)) {
        throw error;
      }

      lastError = error;

      if (attempt === RETRY_DELAYS_MS.length - 1) {
        break;
      }

      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw new Error(`Classification failed after 3 attempts: ${lastError?.message ?? "unknown error"}`);
}
