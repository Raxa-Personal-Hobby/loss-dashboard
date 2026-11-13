#!/bin/bash
# bash bundle.sh                 -> bundle.html for claude.ai (optional AI color lookup, platform downloads)
# LOSS_OFFLINE=1 bash bundle.sh  -> bundle.html with src/lib/claude.offline.ts swapped in: no AI, no platform code
set -e
cd "$(dirname "$0")"
rm -rf dist .parcel-cache bundle.html
if [ "${LOSS_OFFLINE:-0}" = "1" ]; then
  cp src/lib/claude.ts /tmp/claude.ts.bak
  trap 'cp /tmp/claude.ts.bak src/lib/claude.ts' EXIT
  cp src/lib/claude.offline.ts src/lib/claude.ts
fi
pnpm exec parcel build index.html --dist-dir dist --no-source-maps --no-cache >/dev/null 2>&1
pnpm exec html-inline dist/index.html > bundle.html
echo "bundle.html ready (LOSS_OFFLINE=${LOSS_OFFLINE:-0})"
