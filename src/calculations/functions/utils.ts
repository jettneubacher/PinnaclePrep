import { FIELDS } from "../fields";

export function parseIntCell(cell: string | undefined): number | null {
  const n = parseInt(String(cell ?? "").trim(), 10);
  return Number.isFinite(n) ? n : null;
}

export function parseFloatCell(cell: string | undefined): number | null {
  const n = parseFloat(String(cell ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

export function isCompleteCompletion(raw: string): boolean {
  return raw.trim() === "Complete";
}

export function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Local calendar date as YYYY-MM-DD (for aligning with CSV session dates). */
export function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function prepWeeksFromIsoDates(
  firstIso: string,
  lastIso: string,
): number | null {
  const a = Date.parse(firstIso.trim());
  const b = Date.parse(lastIso.trim());
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const diffDays = Math.ceil(Math.abs(b - a) / 86400000);
  return Math.ceil(diffDays / 7);
}

export function parseGradYearFromRow(
  row: Record<string, string> | null | undefined,
): number | null {
  if (!row) return null;
  return parseIntCell(row[FIELDS.GRAD_YEAR]);
}
