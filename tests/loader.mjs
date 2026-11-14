// Lets `node --test` run the app's TypeScript directly with Node's built-in type stripping.
// The app imports files without extensions and uses the "@/" alias (Vite resolves both);
// this hook does the same for tests. No extra packages.
import { register } from "node:module";
register("./resolve.mjs", import.meta.url);
