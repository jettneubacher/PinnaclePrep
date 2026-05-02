# Pinnacle Prep Stats

## Downloading

TODO: once compiled and released on gh using a workflow, add isntructions for access here. include mention about initial open on mac (unsigned app problem)

## App Usage

TODO: once app is done, add simple user instructions here

## Dev testing

TODO: add the tauri instructions for install and setup, bun install and setup, git clone, bun install, bun run tauri dev, etc. etc.

# About the app

Tauri + React TS + Bun + Vite

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
