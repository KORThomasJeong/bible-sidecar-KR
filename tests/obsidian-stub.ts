// Minimal stub of the Obsidian API so pure-logic modules that import from
// "obsidian" can be unit-tested with vitest (no real Obsidian runtime).
export const requestUrl = async () => ({ json: [] });
export const normalizePath = (p: string) => p;
export class App {}
