import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"scripts",
		"tests",
		"vitest.config.mjs",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"package.json",
		"package-lock.json",
		"tsconfig.json",
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.mts", "manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		rules: {
			// DOM addEventListener handlers legitimately return promises.
			"@typescript-eslint/no-misused-promises": [
				"error",
				{ checksVoidReturn: false },
			],
			// PluginSettingTab.display() is deprecated since 1.13.0 but still the
			// standard, documented settings API; getSettingDefinitions is brand new.
			"@typescript-eslint/no-deprecated": "warn",
		},
	}
);
