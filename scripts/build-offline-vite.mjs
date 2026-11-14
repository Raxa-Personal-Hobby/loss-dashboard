// Builds the one-file offline dashboard with Vite: offline/Loss Dashboard (offline).html
//
// Same result as build-offline.sh (Parcel), for machines where Parcel's native SWC binary
// won't load. v1.2.0 was released with this script.
//   - Swaps in src/lib/claude.offline.ts through an alias, so no AI or platform code is bundled
//     (no source file is changed during the build).
//   - Inlines all JavaScript, CSS and fonts into one HTML file.
//   - Adds the same Content-Security-Policy tag as build-offline.sh, so the browser blocks
//     every web request (connect-src data: blob:).
//
// Run: pnpm build:offline
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist-offline");
const outFile = path.join(root, "offline", "Loss Dashboard (offline).html");

await build({
  root,
  configFile: false,
  base: "./",
  logLevel: "warn",
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/lib\/claude$/, replacement: path.join(root, "src/lib/claude.offline.ts") },
      { find: "@", replacement: path.join(root, "src") },
    ],
  },
  build: {
    outDir: dist,
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 100_000,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});

let html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const read = (ref) => fs.readFileSync(path.join(dist, ref.replace(/^\.\//, "")), "utf8");
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>${read(href)}</style>`);
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => `<script type="module">${read(src).replace(/<\/script/gi, "<\\/script")}</script>`);
if (/(src|href)="\.\/assets\//.test(html)) throw new Error("an asset was not inlined");
if (html.includes("You help set up a branded")) throw new Error("AI prompt text found in the offline build");

// Content-Security-Policy: the browser itself blocks any network request (connect-src allows only data: and blob:).
const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src data: blob:; worker-src blob:; media-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'">`;
const m = html.match(/^<!doctype html>\s*<html[^>]*>/i);
if (!m) throw new Error("unexpected start of file");
html = "<!DOCTYPE html>" + m[0].replace(/^<!doctype html>\s*/i, "") + csp + html.slice(m[0].length);

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
fs.rmSync(dist, { recursive: true, force: true });
console.log(`wrote ${path.relative(root, outFile)} (${(html.length / 1e6).toFixed(2)} MB)`);
