/**
 * CSV files and metadata in the Tauri app data directory.
 *
 * - readMetadata — Load `metadata.json` as an array (empty if missing/invalid).
 * - writeMetadata — Replace `metadata.json` with the given array.
 * - saveCSV — Write a CSV under `csvs/` with a unique disk name (`name(2).csv`, `name(3).csv`, … if `name` is taken; `name(2)(2).csv` if `name(2).csv` is taken); appends metadata with original name as `displayName`.
 * - listCSVs — Return all metadata entries (display name, disk name, upload time).
 * - readCSV — Read the raw text of one stored file by disk name.
 * - deleteCSV — Remove a file from `csvs/` (if present) and always drop its metadata row.
 * - renameCSV — Change only the user-visible display name in metadata (file on disk unchanged).
 */
import { appDataDir } from '@tauri-apps/api/path';
import {
  BaseDirectory,
  mkdir,
  writeTextFile,
  readTextFile,
  remove,
  exists,
} from '@tauri-apps/plugin-fs';

/** Subfolder under the app data directory where CSV files live. */
const CSV_DIR = 'csvs';

/** Metadata index stored next to `csvs/`, not inside it. */
const METADATA_FILE = 'metadata.json';

/** Path to a file inside `csvs/`, relative to {@link BaseDirectory.AppData}. */
function csvRelativePath(fileName: string): string {
  return `${CSV_DIR}/${fileName}`;
}

export interface CsvMetadata {
  /** Actual filename on disk, never changes. */
  fileName: string;
  /** User-facing name, editable via `renameCSV`. */
  displayName: string;
  /** ISO 8601 timestamp set at upload time. */
  uploadedAt: string;
}

function assertBasename(fileName: string): void {
  if (
    !fileName ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName === '.' ||
    fileName === '..'
  ) {
    throw new Error(
      'fileName must be a single file name (no folders or path separators).',
    );
  }
}

const APP_DATA = BaseDirectory.AppData;

/** Ensures `csvs/` exists under app data. */
async function ensureCsvDir(): Promise<void> {
  await mkdir(CSV_DIR, { baseDir: APP_DATA, recursive: true });
}

function splitStemExt(fileName: string): { stem: string; ext: string } {
  const i = fileName.lastIndexOf(".");
  if (i <= 0 || i >= fileName.length - 1) {
    return { stem: fileName, ext: "" };
  }
  return { stem: fileName.slice(0, i), ext: fileName.slice(i) };
}

async function isDiskFileNameTaken(fileName: string): Promise<boolean> {
  assertBasename(fileName);
  if (await exists(csvRelativePath(fileName), { baseDir: APP_DATA })) {
    return true;
  }
  const meta = await readMetadata();
  return meta.some((m) => m.fileName === fileName);
}

/**
 * If `desired` is free, use it. Otherwise try `stem(2)ext`, `stem(3)ext`, …
 * (`stem`/`ext` from the full uploaded name, so `foo(2).csv` → `foo(2)(2).csv`, …).
 */
async function allocateUniqueDiskFileName(desired: string): Promise<string> {
  assertBasename(desired);
  if (!(await isDiskFileNameTaken(desired))) {
    return desired;
  }
  const { stem, ext } = splitStemExt(desired);
  let n = 2;
  for (;;) {
    const candidate = `${stem}(${n})${ext}`;
    assertBasename(candidate);
    if (!(await isDiskFileNameTaken(candidate))) {
      return candidate;
    }
    n += 1;
  }
}

function parseMetadataJson(raw: string): CsvMetadata[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }
  const out: CsvMetadata[] = [];
  for (const item of data) {
    if (
      item !== null &&
      typeof item === 'object' &&
      'fileName' in item &&
      'displayName' in item &&
      'uploadedAt' in item &&
      typeof (item as CsvMetadata).fileName === 'string' &&
      typeof (item as CsvMetadata).displayName === 'string' &&
      typeof (item as CsvMetadata).uploadedAt === 'string'
    ) {
      out.push({
        fileName: (item as CsvMetadata).fileName,
        displayName: (item as CsvMetadata).displayName,
        uploadedAt: (item as CsvMetadata).uploadedAt,
      });
    }
  }
  return out;
}

/** Reads and parses `metadata.json` in the app data directory; returns `[]` if missing or invalid. */
export async function readMetadata(): Promise<CsvMetadata[]> {
  if (!(await exists(METADATA_FILE, { baseDir: APP_DATA }))) {
    return [];
  }
  const raw = await readTextFile(METADATA_FILE, { baseDir: APP_DATA });
  return parseMetadataJson(raw);
}

/** Writes the full metadata array to `metadata.json` (creates or overwrites the file). */
export async function writeMetadata(entries: CsvMetadata[]): Promise<void> {
  await mkdir(await appDataDir(), { recursive: true });
  await writeTextFile(METADATA_FILE, `${JSON.stringify(entries, null, 2)}\n`, {
    baseDir: APP_DATA,
  });
}

export async function saveCSV(fileName: string, content: string): Promise<void> {
  assertBasename(fileName);
  await ensureCsvDir();
  const diskName = await allocateUniqueDiskFileName(fileName);
  await writeTextFile(csvRelativePath(diskName), content, { baseDir: APP_DATA });

  const meta = await readMetadata();
  meta.push({
    fileName: diskName,
    displayName: fileName,
    uploadedAt: new Date().toISOString(),
  });
  await writeMetadata(meta);
}

export async function listCSVs(): Promise<CsvMetadata[]> {
  return readMetadata();
}

export async function readCSV(fileName: string): Promise<string> {
  assertBasename(fileName);
  return readTextFile(csvRelativePath(fileName), { baseDir: APP_DATA });
}

export async function deleteCSV(fileName: string): Promise<void> {
  assertBasename(fileName);
  const rel = csvRelativePath(fileName);
  if (await exists(rel, { baseDir: APP_DATA })) {
    await remove(rel, { baseDir: APP_DATA });
  }

  const meta = await readMetadata();
  await writeMetadata(meta.filter((m) => m.fileName !== fileName));
}

/** Updates only `displayName` in metadata; the file on disk keeps the same `fileName`. */
export async function renameCSV(fileName: string, newDisplayName: string): Promise<void> {
  assertBasename(fileName);
  const meta = await readMetadata();
  const idx = meta.findIndex((m) => m.fileName === fileName);
  if (idx === -1) {
    throw new Error(`No metadata entry for file: ${fileName}`);
  }
  const next = meta.slice();
  next[idx] = { ...next[idx], displayName: newDisplayName };
  await writeMetadata(next);
}
