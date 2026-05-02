# AGENTS.md

## Project Overview

PPStats is a lightweight desktop application for uploading, managing, and visualizing statistics from CSV files exported from a database. The app is built for a single non-technical user and prioritizes simplicity, reliability, and a clean UI over complexity.

## Stack

- **Tauri 2** — desktop app shell, native file system access via IPC bridge
- **React + TypeScript** — all UI and application logic
- **Vite** — frontend dev server and bundler
- **Bun** — package manager and script runner
- **`@tauri-apps/plugin-fs`** — file system plugin for reading/writing to app data directory (no custom Rust commands needed for fs operations)

## Architecture

The frontend (React/TS) is the only place application logic lives. There is no custom Rust backend code beyond the default Tauri boilerplate. All file system operations go through the Tauri fs plugin via its JavaScript API, which bridges to Rust internally.

The app uses no database. CSV files are stored as raw files in the Tauri app data directory (`~/Library/Application Support/ppstats/csvs/` on Mac). All CSV management logic lives in `src/lib/csvStorage.ts`.

## CSV Persistence Rules

- CSVs uploaded by the user are **persisted forever** in the app data directory
- They are **never deleted automatically** under any circumstances
- The user may manually delete or rename CSVs through the app UI
- On every app launch, all previously uploaded CSVs are loaded from app data and available immediately
- Because the source database schema may change over time (columns added, renamed, removed), CSVs are stored and read as raw files — there is no rigid schema or database layer that would require migrations

## Packaging & Distribution

This app is packaged for macOS as an **unsigned DMG** and published via **GitHub Releases** using the **Release macOS DMG** workflow (`workflow_dispatch`, version input → tag `v…`, fixed release title in YAML). Local parity: `./buildmac.sh`.

This app will be packaged for macOS and distributed via GitHub Releases as a `.dmg` file. All code changes should be made with this end goal in mind:

- Do not rely on any local development tooling or environment-specific paths at runtime
- Use Tauri's built-in path APIs (`appDataDir()` etc.) rather than hardcoded paths so they resolve correctly in a compiled, installed app
- Avoid any dependencies or patterns that work in `tauri dev` but break in a production build
- The app is not signed with an Apple Developer certificate — users will need to right-click → Open on first launch to bypass Gatekeeper

## Stats pipeline (`src/calculations`)

Statistics are **pure TypeScript**: no second CSV parse in the stats layer. The pipeline consumes rows that were already parsed when the user opened the Data/Stats flows.

### Layout

| File | Role |
| --- | --- |
| `fields.ts` | Single source of truth for **exact CSV header strings** (`FIELDS.*`). Stats and any row logic must use these constants—do not duplicate raw header names across the codebase. |
| `stats.ts` | **`STATS`**: array of `StatConfig` (id, label, `requiredFields`, optional `requiredNonEmptyFields`, `calculate`). Each stat’s `calculate(mergedRows)` receives **all merged rows** from qualifying files as `Record<string, string>[]` (cells are strings; cast inside the calculator as needed). |
| `pipeline.ts` | **`runStats`**: for each stat, keeps only CSVs whose first row’s keys include every `requiredFields` header; drops rows missing any `requiredNonEmptyFields` (defaults to all of `requiredFields` if omitted); **concatenates** surviving rows from contributing files; calls `calculate`. Returns `StatRunResult[]` (`statId`, `label`, `result`, `contributingFiles`). Also **`buildCsvInputsFromDatasets`** / **`rowsToStringRecords`** to bridge `CsvDataContext` datasets into `CsvInput[]`. |
| `avgTotalImprovement.ts` (and future `*.ts`) | **Implementations** for specific metrics. Keep them testable and free of React; import `FIELDS` and export functions used by `stats.ts`. |

### `StatConfig` rules

- **`requiredFields`**: column headers that must **exist** on a file for it to participate. Used for `csvHasAllColumns`.
- **`requiredNonEmptyFields`**: per row, every listed header must be **non-empty** after trim for the row to be kept. Use this when some columns are legitimately blank on many rows (e.g. `BASELINE` only on baseline rows). If omitted, every `requiredFields` column must be non-empty on each row—too strict for baseline-style stats.
- **`id`**: stable string key for UI maps and future aggregated result objects; must stay unique per job.

### Contexts that wire the pipeline

Provider order in `App.tsx` matters:

1. **`CsvLibraryProvider`** — list of uploaded CSVs (`metadata.json` + disk names).
2. **`CsvDataProvider`** — lazy-loads parsed **`datasets`**: `fileName` → `{ rows, fields, parseErrors }`. Stats must read from here, not re-read disk in the calculation path.
3. **`DataPageProvider`** / **`StatsPageProvider`** — **above the router** so Data/Stats page state survives route changes.

**`StatsPageContext`** (`StatsPageContext.tsx`):

- Sidebar **selection** (which files to include) is trimmed when a file disappears from the library (checkbox state only).
- **`lastCalculated`** and **`statResultsById`** are **immutable snapshots** from the last **Calculate** click: they are **not** cleared or rewritten when those files are later deleted, renamed, or missing from the library. Do not add effects that “sync” or invalidate them from `rows`.
- **`runCalculate`** builds `CsvInput[]` via `buildCsvInputsFromDatasets(selectedOrder, datasets)`, then `runStats(inputs, STATS)` and stores results in a `Map` keyed by `statId`.

When adding a new statistic: add `FIELDS` if new columns are needed, implement logic in a dedicated module, append a `StatConfig` to `STATS`, and surface the string (or structured result later) on the Stats page using `statId` as the key.

## Development

```bash
bun install         # install dependencies
bun run tauri dev   # start dev server with hot reload
bun run tauri build # compile and package for distribution
```