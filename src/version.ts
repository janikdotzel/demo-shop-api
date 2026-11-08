import { readFileSync } from "node:fs";

/** The service version from package.json. Resolves from src/ (tsx) and dist/ (build) alike. */
export const APP_VERSION: string = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }
).version;
