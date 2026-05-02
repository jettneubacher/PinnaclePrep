/** Whether a browser File should be treated as a CSV for upload. */
export function isCsvFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv")) {
    return true;
  }
  const t = file.type.toLowerCase();
  return (
    t === "text/csv" ||
    t === "application/csv" ||
    t === "application/vnd.ms-excel" ||
    t === "text/comma-separated-values"
  );
}
