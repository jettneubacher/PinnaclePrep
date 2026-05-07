# Pinnacle Prep Stats

## Downloading

[TUTORIAL VIDEO: HOW TO DOWNLOAD](https://youtu.be/VYGNNecXKII)

1. Open the repo’s **Releases** page on GitHub and download the latest **`.dmg`** (asset attached to the release).
2. Open the DMG, drag **ppstats** (or the app name shown) into **Applications**.
3. **First launch (unsigned build):** browsers tag the app with **quarantine**. macOS may say the app is **“damaged”** and tell you to move it to Trash—that usually means **Gatekeeper + quarantine**, not a bad file. On many Macs, **Right‑click → Open** or **System Settings → Privacy & Security → Open Anyway** (after a failed launch) is enough; on others **neither appears**, and the only reliable workaround is to clear quarantine yourself (see below). The proper long‑term fix is **Apple Developer ID signing + notarization** (not set up for this project yet).

   **If the app won’t open**, open **Terminal** and run (only if you trust this release from our GitHub):

   ```bash
   xattr -dr com.apple.quarantine /Applications/ppstats.app
   ```

   Then open the app from **Applications** again. Your data in Application Support is unchanged.

## App usage

1. **Files** — Upload CSVs exported from your database. They are saved under the app data directory (forever) and listed here; you can rename or delete entries from this screen.
2. **Data** — Pick a CSV from the sidebar to inspect rows in a table.
3. **Stats** — Which uploaded files are included and which students are included determine the merged cohort. When those inputs and parsed data permit, the stats pipeline reruns automatically and refreshes **`StatRunResult`** output for each registered job (`CALCULATIONS.md`).

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

## Updating (keep your data)

Your CSV library and app data live in the **app data directory** (on macOS, typically under **`~/Library/Application Support/`** in a folder derived from the bundle id **`com.pinnacleprep.ppstats`**). They are **not** inside the `.app` bundle.

**Safe update:** Download the new DMG, then either drag the new app into **Applications** and choose **Replace**, or delete only the old app from **Applications** and copy the new one in. **Do not** delete that **Application Support** data folder unless you intend to wipe all saved CSVs.

**Avoid:** “Uninstall” tools that remove support files for the app unless you want a clean slate.

# About the app

Tauri + React + TypeScript + Bun + Vite. Application logic lives in the frontend; CSV files are stored as raw files plus a JSON index (see **App data layout**).

## Calculations

Exported CSVs are parsed once in **`CsvDataContext`**: each library file can be loaded into memory as a **`CsvDataset`** (`rows` as `Record<string, unknown>[]` from Papa Parse). The **stats pipeline does not parse CSVs again**; it converts those rows to string records and merges files that qualify.

**Flow:**

1. **`StatsPageContext`** invokes **`runStats`** when the included CSV set, optional student subset, and loaded **`datasets`** support a full pass. **`includeStudentKeys`**, when set after merge and column/non-empty filtering, trims rows before **`buildStudentTestAnalytics`**.
2. **`runStats`** (`src/calculations/pipeline.ts`) groups **`STATS`** (`src/calculations/stats/index.ts`) by merge signature (**`requiredFields`** + **`requiredNonEmptyFields`**), merges contributing files per group, optionally filters by student keys, builds **`StudentAnalyticsContext`** once per group, then calls each job’s **`calculate(ctx)`**.
3. Each **`StatRunResult`** includes **`statId`**, **`label`**, **`summary`**, **`data`** (job-specific structured payload), and **`contributingFiles`**. Consumers use **`summary`** and **`data`** together (**`statId`** is the stable key).

**`src/calculations/fields.ts`** defines **`FIELDS`**. See **`CALCULATIONS.md`** for the full list of stat jobs, shared context rules, and how jobs relate.

**Defining a statistic:** add headers to **`FIELDS`** if needed; extend **`functions/buildContext.ts`** if new derived fields are required; add **`functions/derive*.ts`** (or a new derive file) and register in **`stats/registry.ts`**.

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
