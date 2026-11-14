import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

export async function resolve(spec, ctx, next) {
  let s = spec;
  if (s.startsWith("@/")) s = pathToFileURL(path.join(SRC, s.slice(2))).href;
  const isRel = s.startsWith(".") || s.startsWith("file:");
  if (isRel && !/\.(ts|tsx|mjs|js|json)$/.test(s)) {
    const base = s.startsWith("file:") ? fileURLToPath(s) : path.resolve(path.dirname(fileURLToPath(ctx.parentURL)), s);
    for (const ext of [".ts", ".tsx", "/index.ts"]) if (existsSync(base + ext)) return next(pathToFileURL(base + ext).href, ctx);
  }
  return next(s, ctx);
}

// The app imports JSON the Vite way (no import attribute). Serve it as a module instead.
export async function load(url, ctx, next) {
  if (url.endsWith(".json")) return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
  return next(url, ctx);
}
