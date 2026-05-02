#!/usr/bin/env bash
# Local macOS release-style build: frontend + Tauri, DMG only, unsigned.
set -euo pipefail
cd "$(dirname "$0")"

echo "Installing JS dependencies…"
bun install

echo "Building DMG (unsigned, CI-friendly flags)…"
bun run tauri build --ci -b dmg --no-sign

DMG_DIR="src-tauri/target/release/bundle/dmg"
echo ""
echo "Done. DMG output:"
ls -la "$DMG_DIR"/*.dmg
