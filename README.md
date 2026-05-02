# Pinnacle Prep Stats

## Downloading

1. Open the repo’s **Releases** page on GitHub and download the latest **`.dmg`** (asset attached to the release).
2. Open the DMG, drag **ppstats** (or the app name shown) into **Applications**.
3. **First launch (unsigned build):** macOS may block the app. Right-click the app in **Applications** → **Open**, then confirm **Open**; or use **System Settings → Privacy & Security → Open Anyway** after a failed launch.

## App usage

1. **Files** — Upload CSVs exported from your database. They are saved under the app data directory (forever) and listed here; you can rename or delete entries from this screen.
2. **Data** — Pick a CSV from the sidebar to inspect rows in a table.
3. **Stats** — Select one or more CSVs, then click **Calculate**. Results appear in the main panel; the list of files used and the numeric summaries are a **snapshot** from that run (they do not change if you later delete or rename those files in the library). To refresh numbers against the current library, run **Calculate** again with the desired selection.

## Dev testing

1. **Prerequisites** — [Bun](https://bun.sh) and the usual Rust / Xcode tooling for Tauri 2 on your platform.
2. **Clone** the repo and install JS dependencies:

   ```bash
   bun install
   ```

3. **Run the app** (Vite + Tauri, hot reload):

   ```bash
   bun run tauri dev
   ```

4. **Web-only check** (no native file APIs; limited functionality):

   ```bash
   bun run dev
   ```

5. **Production web build** (TypeScript + Vite bundle only):

   ```bash
   bun run build
   ```

6. **Desktop release build** (all default bundles for the current OS):

   ```bash
   bun run tauri build
   ```

7. **macOS DMG only, locally** (matches CI: unsigned, DMG artifact under `src-tauri/target/release/bundle/dmg/`):

   ```bash
   ./buildmac.sh
   ```

## Releasing (maintainers)

Releases are created **manually** from GitHub Actions; repo versions in `package.json` / `tauri.conf.json` / `Cargo.toml` are **not** auto-bumped.

Only **allowlisted GitHub accounts** can run the release workflow (see the `check-allowed-actor` job in `.github/workflows/release-mac-dmg.yml`). Anyone else’s run fails immediately.

1. Push or merge the commit you want to ship to a branch (often `main`).
2. Go to **Actions** → **Release macOS DMG** → **Run workflow**.
3. Open the **“Use workflow from”** dropdown and pick the **branch or tag** to build from (that ref is checked out; the tag and release point at that commit). The workflow file must exist on the ref you choose.
4. Enter **version** as semver **without** a `v` (e.g. `1.2.0`). The workflow creates tag **`v1.2.0`**, a GitHub Release, and attaches the **DMG** plus auto-generated release notes.

To ship again, run the workflow again with a **new** version (tags must be unique).

## Updating (users) — keep your data

Your CSV library and app data live in the **app data directory** (on macOS, typically under **`~/Library/Application Support/`** in a folder derived from the bundle id **`com.pinnacleprep.ppstats`**). They are **not** inside the `.app` bundle.

**Safe update:** Download the new DMG, then either drag the new app into **Applications** and choose **Replace**, or delete only the old app from **Applications** and copy the new one in. **Do not** delete that **Application Support** data folder unless you intend to wipe all saved CSVs.

**Avoid:** “Uninstall” tools that remove support files for the app unless you want a clean slate.

# About the app

Tauri + React + TypeScript + Bun + Vite. Application logic lives in the frontend; CSV files are stored as raw files plus a JSON index (see **App data layout**).

## Calculations

Exported CSVs are parsed once in **`CsvDataContext`**: each library file can be loaded into memory as a **`CsvDataset`** (`rows` as `Record<string, unknown>[]` from Papa Parse). The **stats pipeline does not parse CSVs again**; it converts those rows to string records and merges files that qualify.

**Flow:**

1. User selects files on the Stats page; **`StatsPageContext`** calls **`buildCsvInputsFromDatasets`** with the current **`datasets`** map and the chosen file order.
2. **`runStats`** in **`src/calculations/pipeline.ts`** runs each **`StatConfig`** from **`STATS`** (`src/calculations/stats.ts`):
   - A file is used only if its rows include **every** header listed in that stat’s **`requiredFields`**.
   - Rows are filtered so **`requiredNonEmptyFields`** (or all `requiredFields` if unset) are non-empty after trim.
   - Qualifying rows from all contributing files are **concatenated** and passed to **`calculate(mergedRows)`**.
3. Each run produces a **`StatRunResult`** with **`statId`**, **`label`**, **`result`** (e.g. a display string), and **`contributingFiles`**. The UI maps findings by **`statId`** so multiple stats stay organized.

**`src/calculations/fields.ts`** defines **`FIELDS`**: internal keys (e.g. `LAST_NAME`) mapped to the **exact** column titles in the CSV (e.g. `"LAST NAME"`). All stats and row logic should use **`FIELDS`** so renames to human-readable headers stay in one place.

**Defining a statistic:** add any new headers to **`FIELDS`**, implement the math in a focused module (e.g. **`avgTotalImprovement.ts`**), then register a **`StatConfig`** in **`STATS`** with the right **`requiredFields`** / **`requiredNonEmptyFields`** (use the narrower non-empty list when columns like **`BASELINE`** are blank on most rows). Heavy parsing or type coercion belongs inside **`calculate`** or the helper module, not in the pipeline.

## App data layout

The app stores user CSVs under the Tauri **app data directory** (`appDataDir()`), which depends on the OS and your app identifier (for example, under Application Support on macOS).

```
<appDataDir>/
  metadata.json    # index of saved CSVs (JSON array)
  csvs/            # raw CSV file contents, one file per saved upload
    <fileName>
    ...
```

**`metadata.json`** is a JSON array of objects with this shape:

| Field | Meaning |
| --- | --- |
| `fileName` | Name of the file inside `csvs/`; stable on disk. |
| `displayName` | Label shown in the UI; can differ from `fileName`. |
| `uploadedAt` | ISO 8601 timestamp from when the file was saved. |

Each entry’s `fileName` matches a file in `csvs/` with the same name. Logic lives in `src/lib/csvStorage.ts`.
