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

This app will be packaged for macOS and distributed via GitHub Releases as a `.dmg` file. All code changes should be made with this end goal in mind:

- Do not rely on any local development tooling or environment-specific paths at runtime
- Use Tauri's built-in path APIs (`appDataDir()` etc.) rather than hardcoded paths so they resolve correctly in a compiled, installed app
- Avoid any dependencies or patterns that work in `tauri dev` but break in a production build
- The app is not signed with an Apple Developer certificate — users will need to right-click → Open on first launch to bypass Gatekeeper

## Development

```bash
bun install         # install dependencies
bun run tauri dev   # start dev server with hot reload
bun run tauri build # compile and package for distribution
```