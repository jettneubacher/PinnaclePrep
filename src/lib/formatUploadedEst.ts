const US_EASTERN = "America/New_York";

function parseUploadIso(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** MM/DD/YYYY in US Eastern (Data & Stats lists). */
export function formatUploadDate(iso: string): string {
  const d = parseUploadIso(iso);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: US_EASTERN,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

/** MM/DD/YYYY plus time and EST/EDT (Files page only). */
export function formatUploadDateTimeEst(iso: string): string {
  const d = parseUploadIso(iso);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: US_EASTERN,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}
