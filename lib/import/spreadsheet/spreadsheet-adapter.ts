import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";

import type { ColumnMapping, NormalizedTransaction, TransactionType } from "../types.js";
import { buildExternalId } from "./external-id.js";
import { parseAmount } from "./parsers/amount.js";
import { parseDate } from "./parsers/date.js";

type SpreadsheetRowValue = string | number | Date | null;
type SpreadsheetRow = Record<string, SpreadsheetRowValue>;

function normalizeHeaderKey(value: string): string {
  return value.trim();
}

function readMappedValue(row: SpreadsheetRow, columnName: string | null): SpreadsheetRowValue {
  if (!columnName) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(row, columnName)) {
    return row[columnName];
  }

  const fallbackEntry = Object.entries(row).find(([key]) => normalizeHeaderKey(key) === normalizeHeaderKey(columnName));
  return fallbackEntry?.[1] ?? null;
}

function sanitizeStringValue(value: SpreadsheetRowValue): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = value instanceof Date ? value.toISOString() : String(value).trim();
  return text === "" ? null : text;
}

function toRawInputValue(value: unknown): string | number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function sanitizeRawRow(row: SpreadsheetRow): Record<string, string | number | null> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, toRawInputValue(value)]),
  );
}

function getCellValue(value: ExcelJS.CellValue): SpreadsheetRowValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "object") {
    if ("result" in value) {
      return getCellValue(value.result ?? null);
    }

    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
  }

  return String(value);
}

async function parseCsv(filePath: string): Promise<SpreadsheetRow[]> {
  const content = await readFile(filePath, "utf-8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as SpreadsheetRow[];
}

async function parseXlsx(filePath: string): Promise<SpreadsheetRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];

  for (let columnIndex = 1; columnIndex <= headerRow.cellCount; columnIndex += 1) {
    const headerValue = getCellValue(headerRow.getCell(columnIndex).value);
    headers.push(headerValue === null ? "" : String(headerValue));
  }

  const rows: SpreadsheetRow[] = [];

  for (let worksheetRowIndex = 2; worksheetRowIndex <= worksheet.rowCount; worksheetRowIndex += 1) {
    const worksheetRow = worksheet.getRow(worksheetRowIndex);
    const row: SpreadsheetRow = {};
    let hasValue = false;

    for (let columnIndex = 1; columnIndex <= headers.length; columnIndex += 1) {
      const header = headers[columnIndex - 1];

      if (!header) {
        continue;
      }

      const value = getCellValue(worksheetRow.getCell(columnIndex).value);

      if (value !== null && !(typeof value === "string" && value.trim() === "")) {
        hasValue = true;
      }

      row[header] = value;
    }

    if (hasValue) {
      rows.push(row);
    }
  }

  return rows;
}

function resolveType(
  typeMap: Record<string, TransactionType> | undefined,
  rawType: SpreadsheetRowValue,
): TransactionType | null {
  if (!typeMap || rawType === null || rawType === undefined) {
    return null;
  }

  const normalizedRawType = String(rawType).trim();
  return typeMap[normalizedRawType] ?? null;
}

export async function parseSpreadsheet(
  opts: ColumnMapping & { filePath: string },
): Promise<NormalizedTransaction[]> {
  const extension = path.extname(opts.filePath).toLowerCase();
  const rows = extension === ".csv" ? await parseCsv(opts.filePath) : await parseXlsx(opts.filePath);
  const transactions: NormalizedTransaction[] = [];

  rows.forEach((row, rowIndexZeroBased) => {
    const rowIndex = rowIndexZeroBased + 1;

    try {
      const dateValue = readMappedValue(row, opts.date);
      const amountValue = readMappedValue(row, opts.amount);
      const rawType = readMappedValue(row, opts.type);
      const concept = sanitizeStringValue(readMappedValue(row, opts.concept)) ?? "";
      const dateISO = parseDate(dateValue as string | number | Date, opts.dateFormat);
      const amount = parseAmount(amountValue as string | number, opts.amountLocale ?? "auto");

      transactions.push({
        external_id: buildExternalId(opts.source, dateISO, amount, concept, rowIndex),
        source: opts.source,
        date: dateISO,
        amount,
        currency: opts.defaultCurrency ?? "ARS",
        type: resolveType(opts.typeMap, rawType),
        person: sanitizeStringValue(readMappedValue(row, opts.person)),
        category: sanitizeStringValue(readMappedValue(row, opts.category)),
        subcategory: sanitizeStringValue(readMappedValue(row, opts.subcategory)),
        concept,
        payment_method: sanitizeStringValue(readMappedValue(row, opts.payment_method)),
        notes: sanitizeStringValue(readMappedValue(row, opts.notes)),
        raw_input: sanitizeRawRow(row),
        row_index: rowIndex,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[spreadsheet] fila ${rowIndex} skipped: ${message}`);
    }
  });

  return transactions;
}
