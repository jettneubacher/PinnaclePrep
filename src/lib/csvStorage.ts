import { appDataDir, join } from '@tauri-apps/api/path';
import {
  mkdir,
  writeTextFile,
  readTextFile,
  remove,
  readDir,
  rename,
  exists,
} from '@tauri-apps/plugin-fs';

/** Subfolder under the app data directory where CSV files live. */
const CSV_DIR = 'csvs';

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

/** Absolute path to the `csvs/` directory inside app data. */
async function csvStoragePath(): Promise<string> {
  return join(await appDataDir(), CSV_DIR);
}

/** Ensures `csvs/` exists. Tauri resolves `appDataDir()` per OS (e.g. Application Support on macOS). */
async function ensureCsvDir(): Promise<void> {
  const dir = await csvStoragePath();
  await mkdir(dir, { recursive: true });
}

export async function saveCSV(fileName: string, content: string): Promise<void> {
  assertBasename(fileName);
  await ensureCsvDir();
  const filePath = await join(await csvStoragePath(), fileName);
  await writeTextFile(filePath, content);
}

export async function listCSVs(): Promise<string[]> {
  const dir = await csvStoragePath();
  if (!(await exists(dir))) {
    return [];
  }
  const entries = await readDir(dir);
  return entries.filter((e) => e.isFile).map((e) => e.name);
}

export async function readCSV(fileName: string): Promise<string> {
  assertBasename(fileName);
  const filePath = await join(await csvStoragePath(), fileName);
  return readTextFile(filePath);
}

export async function deleteCSV(fileName: string): Promise<void> {
  assertBasename(fileName);
  const filePath = await join(await csvStoragePath(), fileName);
  await remove(filePath);
}

export async function renameCSV(oldName: string, newName: string): Promise<void> {
  assertBasename(oldName);
  assertBasename(newName);
  const dir = await csvStoragePath();
  await rename(await join(dir, oldName), await join(dir, newName));
}
