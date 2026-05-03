# AGENTS.md

## Project Overview

PPStats is a lightweight desktop application for uploading, managing, and analyzing statistics from CSV files exported from a database. It is aimed at a single non-technical operator and favors simplicity and predictable behavior over feature sprawl.

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

Built for macOS as an **unsigned DMG**, published via **GitHub Releases** (**Release macOS DMG** workflow: `workflow_dispatch`, branch/tag + semver version → `v…` tag; only **allowlisted** actors via `check-allowed-actor` in `.github/workflows/release-mac-dmg.yml`). Local parity: `./buildmac.sh`.

Runtime and packaging constraints:

- No reliance on developer-only tooling or environment-specific paths
- Use Tauri path helpers (`appDataDir()`, etc.), not hardcoded OS paths
- Avoid patterns that work in dev but fail in release builds

The build is **not** Apple-developer-signed; first launch typically requires overriding Gatekeeper (see README).

## Stats pipeline (`src/calculations`)

Statistics are **pure TypeScript**: no second CSV parse in the stats layer. The pipeline consumes rows that were already parsed when the user opened the Data/Stats flows.

### Layout

| File / folder | Role |
| --- | --- |
| `fields.ts` | Single source of truth for **exact CSV header strings** (`FIELDS.*`). |
| `stats/types.ts`, `stats/registry.ts`, `stats/index.ts` | **`STATS`**: `StatConfig[]` (id, label, `requiredFields`, optional `requiredNonEmptyFields`, **`calculate(ctx)`**). Each `calculate` receives **`StudentAnalyticsContext`** from **`buildStudentTestAnalytics(merged)`** (not raw rows). Returns **`{ summary, data }`**. |
| `functions/buildContext.ts` | **`buildStudentTestAnalytics`**: one pass → rollups + per-(student, test type) blocks (baseline, latest, improvements, progression, tutoring, remote, prep weeks, etc.). |
| `functions/derive*.ts` | Pure **derive** functions: `context → { summary, data }`. Add new metrics here; wire in `stats/registry.ts`. |
| `pipeline.ts` | Merge/filter rows; **group** stats by field signature; for each group build **one** context, run each job; returns **`StatRunResult[]`** (`statId`, `label`, **`summary`**, **`data`**, `contributingFiles`). **`buildCsvInputsFromDatasets`** / **`rowsToStringRecords`**. |
| **`CALCULATIONS.md`** | Human index of all stat jobs, shared context rules, and relationships. |

### `StatConfig` rules

- **`requiredFields`**: column headers that must **exist** on a file for it to participate. Used for `csvHasAllColumns`.
- **`requiredNonEmptyFields`**: per row, every listed header must be **non-empty** after trim for the row to be kept. If omitted, every `requiredFields` column must be non-empty on each row.
- **`calculate(ctx)`**: must not re-derive baseline/latest; read **`ctx.blocks`** / **`ctx.rollups`**.
- **`id`**: stable string key for UI maps; must stay unique per job.

### Contexts that feed the pipeline

Provider order in `App.tsx` matters:

1. **`CsvLibraryProvider`** — authoritative list of persisted CSVs (`metadata.json` + disk names).
2. **`CsvDataProvider`** — lazy-loads **`datasets`**: `fileName` → `{ rows, fields, parseErrors }`. The calculation path consumes this; it does **not** re-read CSV bytes from disk.
3. **`DataPageProvider`** / **`StatsPageProvider`** — scoped **above** the router so route changes do not drop page-local state tied to CSV/stats flows.

**`StatsPageContext`** (`StatsPageContext.tsx`) drives **`runStats`**: it resolves which library files participate, ensures their **`datasets`** are loaded, optionally passes **`includeStudentKeys`** after merge/non-empty filtering to restrict the cohort, and stores **`statResultsById`** / **`statsAnalyticsMeta`** on success. **`includeStudentKeys`** is omitted or empty-sized to retain all merged students; overlapping async runs are invalidated with a generation counter. **`studentsInSelectedCsvs`** / **`calculationStudents`** derive from the active file set and the last successful cohort, respectively—used so selection state stays aligned with persisted files and merged keys.

When adding a new statistic: extend **`buildContext`** if new per-block or rollup fields are needed; add a derive under **`functions/`**; register in **`stats/registry.ts`**; update **`CALCULATIONS.md`**. Each **`StatRunResult`** includes **`statId`**, **`label`**, **`summary`**, **`data`**, and **`contributingFiles`**.

## Development

```bash
bun install         # install dependencies
bun run tauri dev   # start dev server with hot reload
bun run tauri build # compile and package for distribution
```