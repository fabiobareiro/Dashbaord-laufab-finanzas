import { createHash } from "node:crypto";

export function buildExternalId(
  source: string,
  date: string,
  amount: number,
  concepto: string,
  rowIndex: number,
): string {
  const payload = `${date}|${amount}|${concepto}|${rowIndex}`;
  const hash16 = createHash("sha256").update(payload).digest("hex").slice(0, 16);

  return `${source}_${hash16}`;
}
