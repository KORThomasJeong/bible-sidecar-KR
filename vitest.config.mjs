import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
		alias: {
			obsidian: new URL("./tests/obsidian-stub.ts", import.meta.url).pathname,
		},
	},
});
