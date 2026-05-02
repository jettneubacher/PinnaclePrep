import Papa from "papaparse";

export type ParsedCsv = {
  fields: string[] | undefined;
  /** One object per row when `header: true`; values are untyped strings from Papa. */
  rows: Record<string, unknown>[];
  parseErrors: Papa.ParseError[];
};

/**
 * Parse CSV text from disk. Structure is intentionally loose — schemas vary.
 */
export function parseStoredCsvText(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (h) => String(h).trim(),
  });

  const rows = (result.data ?? []).filter(
    (row): row is Record<string, unknown> =>
      row !== null && typeof row === "object" && !Array.isArray(row),
  );

  return {
    fields: result.meta.fields,
    rows,
    parseErrors: result.errors ?? [],
  };
}
