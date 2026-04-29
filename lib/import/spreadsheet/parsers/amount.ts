const CURRENCY_TOKENS = /(AR\$|U\$S|US\$|ARS|USD|€|\$)/gi;

function normalizeQuotedString(value: string): string {
  return value.trim().replace(/^["']+|["']+$/g, "");
}

function normalizeWithDecimal(value: string, separator: "." | ","): string {
  const parts = value.split(separator);

  if (parts.length === 1) {
    return value;
  }

  const decimal = parts.pop() ?? "";
  return `${parts.join("")}.${decimal}`;
}

function stripThousands(value: string, separator: "." | ","): string {
  return value.split(separator).join("");
}

function inferAutoLocale(value: string): string {
  const hasDot = value.includes(".");
  const hasComma = value.includes(",");

  if (hasDot && hasComma) {
    const decimalSeparator = value.lastIndexOf(".") > value.lastIndexOf(",") ? "." : ",";
    const thousandsSeparator = decimalSeparator === "." ? "," : ".";

    return normalizeWithDecimal(stripThousands(value, thousandsSeparator), decimalSeparator);
  }

  if (hasDot || hasComma) {
    const separator = hasDot ? "." : ",";
    const digitsAfterSeparator = value.length - value.lastIndexOf(separator) - 1;

    if (digitsAfterSeparator === 2) {
      return normalizeWithDecimal(value, separator);
    }

    return stripThousands(value, separator);
  }

  return value;
}

export function parseAmount(
  raw: string | number,
  locale: "AR" | "US" | "auto" = "auto",
): number {
  if (typeof raw === "number") {
    return raw;
  }

  const originalRaw = raw;
  const quoted = normalizeQuotedString(raw);
  const isNegative = quoted.startsWith("-") || /^\(.*\)$/.test(quoted);
  let cleaned = quoted.replace(/^\((.*)\)$/, "$1").replace(/^-/, "");

  cleaned = cleaned.replace(CURRENCY_TOKENS, "").replace(/\s+/g, "");
  cleaned = cleaned.replace(/[^\d.,]/g, "");

  let normalized = cleaned;

  if (locale === "AR") {
    normalized = normalizeWithDecimal(stripThousands(cleaned, "."), ",");
  } else if (locale === "US") {
    normalized = normalizeWithDecimal(stripThousands(cleaned, ","), ".");
  } else {
    normalized = inferAutoLocale(cleaned);
  }

  const amount = Number(normalized);

  if (Number.isNaN(amount)) {
    throw new Error(`Invalid amount: ${originalRaw}`);
  }

  // Schema requires amount > 0; sign info should live in `type` (ingreso/egreso).
  // Parser returns absolute value; the sign hint can be used by typeMap if needed.
  return Math.abs(amount);
}
