import Papa from "papaparse";

export type ParsedCsv = {
  fields: string[] | undefined;
  /** One object per row when `header: true`; values are untyped strings from Papa. */
  rows: Record<string, unknown>[];
  parseErrors: Papa.ParseError[];
};

function isBlankCell(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

function isBlankRow(row: readonly unknown[]): boolean {
  return row.length === 0 || row.every(isBlankCell);
}

/**
 * Database exports sometimes pad the sheet with a leading blank row and/or
 * column. Trim only while every cell in that row/column is blank so normal
 * CSVs (no padding) pass through unchanged.
 */
export function trimLeadingBlankRowsAndColumns(
  grid: string[][],
): string[][] {
  let trimmed = grid;
  while (trimmed.length > 0 && isBlankRow(trimmed[0]!)) {
    trimmed = trimmed.slice(1);
  }
  if (trimmed.length === 0) return trimmed;

  const width = trimmed.reduce((max, row) => Math.max(max, row.length), 0);
  let dropCols = 0;
  while (dropCols < width) {
    const columnBlank = trimmed.every((row) => isBlankCell(row[dropCols]));
    if (!columnBlank) break;
    dropCols += 1;
  }
  if (dropCols === 0) return trimmed;
  return trimmed.map((row) => row.slice(dropCols));
}

function recordsFromGrid(grid: string[][]): {
  fields: string[] | undefined;
  rows: Record<string, unknown>[];
} {
  if (grid.length === 0) {
    return { fields: [], rows: [] };
  }

  const headerCells = grid[0] ?? [];
  const fields: string[] = [];
  for (let colIndex = 0; colIndex < headerCells.length; colIndex += 1) {
    const key = String(headerCells[colIndex] ?? "").trim();
    if (key !== "") fields.push(key);
  }

  const rows: Record<string, unknown>[] = [];
  for (let rowIndex = 1; rowIndex < grid.length; rowIndex += 1) {
    const cells = grid[rowIndex] ?? [];
    if (isBlankRow(cells)) continue;

    const record: Record<string, unknown> = {};
    for (let colIndex = 0; colIndex < headerCells.length; colIndex += 1) {
      const key = String(headerCells[colIndex] ?? "").trim();
      if (key === "") continue;
      record[key] = cells[colIndex] ?? "";
    }
    rows.push(record);
  }

  return { fields, rows };
}

/**
 * Parse CSV text from disk. Structure is intentionally loose — schemas vary.
 */
export function parseStoredCsvText(text: string): ParsedCsv {
  const raw = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: false,
    dynamicTyping: false,
  });

  const grid = trimLeadingBlankRowsAndColumns(
    (raw.data ?? []).filter((row): row is string[] => Array.isArray(row)),
  );
  const { fields, rows } = recordsFromGrid(grid);

  return {
    fields,
    rows,
    parseErrors: raw.errors ?? [],
  };
}
