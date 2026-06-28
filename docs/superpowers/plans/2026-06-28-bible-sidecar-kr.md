# Bible Sidecar KR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `bible-sidecar-obsidian-plugin` into `bible-sidecar-KR` — a Korean-focused Bible sidebar limited to 4 versions (개역한글/개역개정/NIV/KJV) with a top search box that jumps directly to a chapter/verse from typed references like `히3`, `히브리서 3`, `히3:5`, or `Heb 3`.

**Architecture:** Three of the four versions (개역한글=`KRV`, `NIV`, `KJV`) stream from the bolls.life REST API exactly as the original plugin does. 개역개정 (`NKRV`) is read at runtime from a user-supplied JSON file inside the vault (path configured in settings; never bundled, so the community-store release contains no copyrighted text). A pure-logic reference module (book table + alias index + parser) powers the search box; the existing browse UI (구약/신약 → book → chapter) stays below the search box untouched in behavior but Koreanized in wording.

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild (existing build), vitest (new — for pure-logic unit tests only), bolls.life API.

## Global Constraints

- Plugin id: `bible-sidecar-kr` (lowercase, must equal the install folder name `.obsidian/plugins/bible-sidecar-kr`; community store rule: no `obsidian` in id).
- Plugin name: `Bible Sidecar KR` (Basic Latin + spaces only — store rule).
- Version: reset to `1.0.0` (SemVer `x.y.z`); release git tag must equal manifest version with **no `v` prefix**.
- License: MIT. Retain original author copyright (`Janis Ringli`) AND add fork copyright. MIT requires the original notice be kept.
- Exactly 4 versions, hardcoded, no language dropdown: `KRV`(개역한글, default), `NKRV`(개역개정, local), `NIV`, `KJV`.
- All user-defined / constructed file paths MUST go through Obsidian `normalizePath()` (store rule).
- 개역개정 text is NEVER committed or bundled. `data.json` and any `*.nkrv.json` are gitignored. The 개역개정 option must **degrade gracefully** (show a Notice, not throw) when the file is absent — reviewers test without it.
- Search granularity: chapter (`히3`) and verse jump (`히3:5` → open ch.3, scroll + highlight v.5).
- Search recognizes BOTH Korean and English book names/abbreviations; matching is **name/alias prefix** (no 초성, no substring).
- Search trigger: live autocomplete suggestions (local, zero API calls) + Enter/click to navigate.
- Book name display follows the version's data language (KRV/NKRV → Korean, NIV/KJV → English).
- Keep the verse-click→clipboard copy feature and all its settings; Koreanize their labels and all UI button text.
- bookid space is the universal 1–66 Protestant order shared by all versions (Genesis=1 … Matthew=40 … Revelation=66). Ignore bolls Apocrypha ids (67+).

---

## File Structure

- `manifest.json` (modify) — fork identity.
- `package.json` (modify) — name, vitest scripts/devDep.
- `versions.json` (modify) — reset to `{ "1.0.0": "0.15.0" }`.
- `LICENSE` (modify) — dual copyright.
- `README.md` (modify) — Korean readme + credits + release/install instructions.
- `.gitignore` (modify) — exclude `*.nkrv.json`.
- `vitest.config.mjs` (create) — test runner config.
- `src/book-data.ts` (create) — `BOOKS` table (bookid, ko, en, chapters) + `buildAliasIndex()` (Korean & English full names + abbreviations → bookid). Pure.
- `src/reference-parser.ts` (create) — `parseReference()` and `suggestBooks()`. Pure.
- `src/bible-source.ts` (create) — `BibleSource` class abstracting getBooks/getChapter across bolls API and local NKRV JSON, plus pure helper `normalizeLocalChapter()`.
- `tests/reference-parser.test.ts` (create) — parser + alias + normalize tests.
- `BibleView.ts` (modify) — wire in `BibleSource`, add search box + autocomplete, `openChapter()` with verse jump, Koreanize UI.
- `settings.ts` (modify) — 4-version dropdown, NKRV path field, Koreanized labels.
- `main.ts` (modify) — settings interface (+`nkrvPath`), default version `KRV`, drop language logic.
- `styles.css` (modify) — search box, suggestion list, verse highlight styles.
- `scripts/convert-nkrv.mjs` (create) — convert a flat verse array to the loader's nested format.
- `docs/RELEASE.md` (create) — community-store submission checklist.

---

## Task 1: Fork metadata & packaging

**Files:**
- Modify: `manifest.json`
- Modify: `package.json`
- Modify: `versions.json`
- Modify: `LICENSE`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: plugin id `bible-sidecar-kr`, name `Bible Sidecar KR`, version `1.0.0` — referenced by release docs.

- [ ] **Step 1: Rewrite `manifest.json`**

```json
{
	"id": "bible-sidecar-kr",
	"name": "Bible Sidecar KR",
	"version": "1.0.0",
	"minAppVersion": "0.15.0",
	"description": "Korean Bible sidebar (개역한글/개역개정/NIV/KJV) with quick reference search like 히3 or Heb 3.",
	"author": "coffee (fork of Bible Sidecar by Janis Ringli)",
	"authorUrl": "https://github.com/janisringli/bible-sidecar-obsidian-plugin",
	"isDesktopOnly": false
}
```

(Note: `fundingUrl` removed — it pointed to the original author.)

- [ ] **Step 2: Update `package.json` name + add vitest**

Change `"name"` to `"bible-sidecar-kr"`, add a `"test"` script and `vitest` devDependency:

```json
	"scripts": {
		"dev": "node esbuild.config.mjs",
		"build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
		"test": "vitest run",
		"version": "node version-bump.mjs && git add manifest.json versions.json"
	},
```

Add to `devDependencies` (keep existing entries):

```json
		"vitest": "^1.6.0"
```

- [ ] **Step 3: Reset `versions.json`**

```json
{
	"1.0.0": "0.15.0"
}
```

- [ ] **Step 4: Rewrite `LICENSE` (MIT, dual copyright)**

```
MIT License

Copyright (c) 2022 Janis Ringli (original "Bible Sidecar" plugin)
Copyright (c) 2026 coffee (Bible Sidecar KR fork)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Append NKRV exclusion to `.gitignore`**

Add at end:

```
# 개역개정 (NKRV) local Bible text — never commit (copyright)
*.nkrv.json
nkrv.json
```

- [ ] **Step 6: Commit**

```bash
git add manifest.json package.json versions.json LICENSE .gitignore
git commit -m "chore: fork as bible-sidecar-kr (metadata, MIT dual copyright)"
```

---

## Task 2: Add vitest tooling

**Files:**
- Create: `vitest.config.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs vitest over `tests/`.

- [ ] **Step 1: Create `vitest.config.mjs`**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
	},
});
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: completes; `node_modules/vitest` exists.

- [ ] **Step 3: Verify the runner starts (no tests yet)**

Run: `npx vitest run`
Expected: exits 0 with "No test files found" (acceptable at this point).

- [ ] **Step 4: Commit**

```bash
git add vitest.config.mjs package-lock.json
git commit -m "chore: add vitest for pure-logic unit tests"
```

---

## Task 3: Book reference data (`src/book-data.ts`)

**Files:**
- Create: `src/book-data.ts`
- Test: `tests/reference-parser.test.ts` (alias section)

**Interfaces:**
- Produces:
  - `interface BookMeta { bookid: number; ko: string; en: string; chapters: number; }`
  - `const BOOKS: BookMeta[]` — 66 entries, bookid 1..66.
  - `function buildAliasIndex(): Map<string, number>` — normalized alias → bookid. Keys are lowercased and space-stripped.
  - `function normalizeToken(s: string): string` — `s.toLowerCase().replace(/\s+/g, "")`.

- [ ] **Step 1: Write failing alias tests**

Create `tests/reference-parser.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { BOOKS, buildAliasIndex, normalizeToken } from "../src/book-data";

describe("BOOKS table", () => {
	it("has 66 books in order", () => {
		expect(BOOKS).toHaveLength(66);
		expect(BOOKS[0]).toMatchObject({ bookid: 1, ko: "창세기", en: "Genesis", chapters: 50 });
		expect(BOOKS[57]).toMatchObject({ bookid: 58, ko: "히브리서", en: "Hebrews", chapters: 13 });
		expect(BOOKS[65]).toMatchObject({ bookid: 66, ko: "요한계시록", en: "Revelation", chapters: 22 });
	});
});

describe("buildAliasIndex", () => {
	const idx = buildAliasIndex();
	it("maps Korean abbreviations", () => {
		expect(idx.get(normalizeToken("히"))).toBe(58);
		expect(idx.get(normalizeToken("창"))).toBe(1);
		expect(idx.get(normalizeToken("계"))).toBe(66);
		expect(idx.get(normalizeToken("요일"))).toBe(62);
		expect(idx.get(normalizeToken("요"))).toBe(43);
		expect(idx.get(normalizeToken("삼상"))).toBe(9);
	});
	it("maps Korean full names", () => {
		expect(idx.get(normalizeToken("히브리서"))).toBe(58);
		expect(idx.get(normalizeToken("요한복음"))).toBe(43);
	});
	it("maps English names and abbreviations", () => {
		expect(idx.get(normalizeToken("hebrews"))).toBe(58);
		expect(idx.get(normalizeToken("heb"))).toBe(58);
		expect(idx.get(normalizeToken("1 john"))).toBe(62);
		expect(idx.get(normalizeToken("ps"))).toBe(19);
	});
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run`
Expected: FAIL — cannot resolve `../src/book-data`.

- [ ] **Step 3: Create `src/book-data.ts`**

```ts
export interface BookMeta {
	bookid: number;
	ko: string;
	en: string;
	chapters: number;
}

// bookid 1..66, standard Protestant order. ko = common Korean name.
export const BOOKS: BookMeta[] = [
	{ bookid: 1, ko: "창세기", en: "Genesis", chapters: 50 },
	{ bookid: 2, ko: "출애굽기", en: "Exodus", chapters: 40 },
	{ bookid: 3, ko: "레위기", en: "Leviticus", chapters: 27 },
	{ bookid: 4, ko: "민수기", en: "Numbers", chapters: 36 },
	{ bookid: 5, ko: "신명기", en: "Deuteronomy", chapters: 34 },
	{ bookid: 6, ko: "여호수아", en: "Joshua", chapters: 24 },
	{ bookid: 7, ko: "사사기", en: "Judges", chapters: 21 },
	{ bookid: 8, ko: "룻기", en: "Ruth", chapters: 4 },
	{ bookid: 9, ko: "사무엘상", en: "1 Samuel", chapters: 31 },
	{ bookid: 10, ko: "사무엘하", en: "2 Samuel", chapters: 24 },
	{ bookid: 11, ko: "열왕기상", en: "1 Kings", chapters: 22 },
	{ bookid: 12, ko: "열왕기하", en: "2 Kings", chapters: 25 },
	{ bookid: 13, ko: "역대상", en: "1 Chronicles", chapters: 29 },
	{ bookid: 14, ko: "역대하", en: "2 Chronicles", chapters: 36 },
	{ bookid: 15, ko: "에스라", en: "Ezra", chapters: 10 },
	{ bookid: 16, ko: "느헤미야", en: "Nehemiah", chapters: 13 },
	{ bookid: 17, ko: "에스더", en: "Esther", chapters: 10 },
	{ bookid: 18, ko: "욥기", en: "Job", chapters: 42 },
	{ bookid: 19, ko: "시편", en: "Psalms", chapters: 150 },
	{ bookid: 20, ko: "잠언", en: "Proverbs", chapters: 31 },
	{ bookid: 21, ko: "전도서", en: "Ecclesiastes", chapters: 12 },
	{ bookid: 22, ko: "아가", en: "Song of Solomon", chapters: 8 },
	{ bookid: 23, ko: "이사야", en: "Isaiah", chapters: 66 },
	{ bookid: 24, ko: "예레미야", en: "Jeremiah", chapters: 52 },
	{ bookid: 25, ko: "예레미야애가", en: "Lamentations", chapters: 5 },
	{ bookid: 26, ko: "에스겔", en: "Ezekiel", chapters: 48 },
	{ bookid: 27, ko: "다니엘", en: "Daniel", chapters: 12 },
	{ bookid: 28, ko: "호세아", en: "Hosea", chapters: 14 },
	{ bookid: 29, ko: "요엘", en: "Joel", chapters: 3 },
	{ bookid: 30, ko: "아모스", en: "Amos", chapters: 9 },
	{ bookid: 31, ko: "오바댜", en: "Obadiah", chapters: 1 },
	{ bookid: 32, ko: "요나", en: "Jonah", chapters: 4 },
	{ bookid: 33, ko: "미가", en: "Micah", chapters: 7 },
	{ bookid: 34, ko: "나훔", en: "Nahum", chapters: 3 },
	{ bookid: 35, ko: "하박국", en: "Habakkuk", chapters: 3 },
	{ bookid: 36, ko: "스바냐", en: "Zephaniah", chapters: 3 },
	{ bookid: 37, ko: "학개", en: "Haggai", chapters: 2 },
	{ bookid: 38, ko: "스가랴", en: "Zechariah", chapters: 14 },
	{ bookid: 39, ko: "말라기", en: "Malachi", chapters: 4 },
	{ bookid: 40, ko: "마태복음", en: "Matthew", chapters: 28 },
	{ bookid: 41, ko: "마가복음", en: "Mark", chapters: 16 },
	{ bookid: 42, ko: "누가복음", en: "Luke", chapters: 24 },
	{ bookid: 43, ko: "요한복음", en: "John", chapters: 21 },
	{ bookid: 44, ko: "사도행전", en: "Acts", chapters: 28 },
	{ bookid: 45, ko: "로마서", en: "Romans", chapters: 16 },
	{ bookid: 46, ko: "고린도전서", en: "1 Corinthians", chapters: 16 },
	{ bookid: 47, ko: "고린도후서", en: "2 Corinthians", chapters: 13 },
	{ bookid: 48, ko: "갈라디아서", en: "Galatians", chapters: 6 },
	{ bookid: 49, ko: "에베소서", en: "Ephesians", chapters: 6 },
	{ bookid: 50, ko: "빌립보서", en: "Philippians", chapters: 4 },
	{ bookid: 51, ko: "골로새서", en: "Colossians", chapters: 4 },
	{ bookid: 52, ko: "데살로니가전서", en: "1 Thessalonians", chapters: 5 },
	{ bookid: 53, ko: "데살로니가후서", en: "2 Thessalonians", chapters: 3 },
	{ bookid: 54, ko: "디모데전서", en: "1 Timothy", chapters: 6 },
	{ bookid: 55, ko: "디모데후서", en: "2 Timothy", chapters: 4 },
	{ bookid: 56, ko: "디도서", en: "Titus", chapters: 3 },
	{ bookid: 57, ko: "빌레몬서", en: "Philemon", chapters: 1 },
	{ bookid: 58, ko: "히브리서", en: "Hebrews", chapters: 13 },
	{ bookid: 59, ko: "야고보서", en: "James", chapters: 5 },
	{ bookid: 60, ko: "베드로전서", en: "1 Peter", chapters: 5 },
	{ bookid: 61, ko: "베드로후서", en: "2 Peter", chapters: 3 },
	{ bookid: 62, ko: "요한일서", en: "1 John", chapters: 5 },
	{ bookid: 63, ko: "요한이서", en: "2 John", chapters: 1 },
	{ bookid: 64, ko: "요한삼서", en: "3 John", chapters: 1 },
	{ bookid: 65, ko: "유다서", en: "Jude", chapters: 1 },
	{ bookid: 66, ko: "요한계시록", en: "Revelation", chapters: 22 },
];

export function normalizeToken(s: string): string {
	return s.toLowerCase().replace(/\s+/g, "");
}

// Korean abbreviations (개역 계열 표준 약칭), bookid-indexed (index 0 unused).
const KO_ABBR: Record<number, string[]> = {
	1: ["창"], 2: ["출"], 3: ["레"], 4: ["민"], 5: ["신"],
	6: ["수"], 7: ["삿"], 8: ["룻"], 9: ["삼상"], 10: ["삼하"],
	11: ["왕상"], 12: ["왕하"], 13: ["대상"], 14: ["대하"], 15: ["스"],
	16: ["느"], 17: ["에"], 18: ["욥"], 19: ["시"], 20: ["잠"],
	21: ["전"], 22: ["아"], 23: ["사"], 24: ["렘"], 25: ["애"],
	26: ["겔"], 27: ["단"], 28: ["호"], 29: ["욜"], 30: ["암"],
	31: ["옵"], 32: ["욘"], 33: ["미"], 34: ["나"], 35: ["합"],
	36: ["습"], 37: ["학"], 38: ["슥"], 39: ["말"], 40: ["마"],
	41: ["막"], 42: ["눅"], 43: ["요"], 44: ["행"], 45: ["롬"],
	46: ["고전"], 47: ["고후"], 48: ["갈"], 49: ["엡"], 50: ["빌"],
	51: ["골"], 52: ["살전"], 53: ["살후"], 54: ["딤전"], 55: ["딤후"],
	56: ["딛"], 57: ["몬"], 58: ["히"], 59: ["약"], 60: ["벧전"],
	61: ["벧후"], 62: ["요일"], 63: ["요이"], 64: ["요삼"], 65: ["유"],
	66: ["계"],
};

// English abbreviations (common). Full English names added automatically from BOOKS.en.
const EN_ABBR: Record<number, string[]> = {
	1: ["gen"], 2: ["exod", "ex"], 3: ["lev"], 4: ["num"], 5: ["deut", "dt"],
	6: ["josh"], 7: ["judg"], 8: ["ruth"], 9: ["1sam", "1sa"], 10: ["2sam", "2sa"],
	11: ["1kgs", "1ki"], 12: ["2kgs", "2ki"], 13: ["1chr", "1ch"], 14: ["2chr", "2ch"], 15: ["ezra"],
	16: ["neh"], 17: ["esth"], 18: ["job"], 19: ["ps", "psa", "psalm"], 20: ["prov", "pr"],
	21: ["eccl"], 22: ["song", "sos"], 23: ["isa"], 24: ["jer"], 25: ["lam"],
	26: ["ezek"], 27: ["dan"], 28: ["hos"], 29: ["joel"], 30: ["amos"],
	31: ["obad"], 32: ["jonah"], 33: ["mic"], 34: ["nah"], 35: ["hab"],
	36: ["zeph"], 37: ["hag"], 38: ["zech"], 39: ["mal"], 40: ["matt", "mt"],
	41: ["mark", "mk"], 42: ["luke", "lk"], 43: ["john", "jn"], 44: ["acts"], 45: ["rom"],
	46: ["1cor"], 47: ["2cor"], 48: ["gal"], 49: ["eph"], 50: ["phil"],
	51: ["col"], 52: ["1thess", "1th"], 53: ["2thess", "2th"], 54: ["1tim", "1ti"], 55: ["2tim", "2ti"],
	56: ["titus"], 57: ["phlm"], 58: ["heb"], 59: ["jas"], 60: ["1pet", "1pe"],
	61: ["2pet", "2pe"], 62: ["1john", "1jn"], 63: ["2john", "2jn"], 64: ["3john", "3jn"], 65: ["jude"],
	66: ["rev"],
};

export function buildAliasIndex(): Map<string, number> {
	const idx = new Map<string, number>();
	const add = (alias: string, bookid: number) => {
		idx.set(normalizeToken(alias), bookid);
	};
	for (const b of BOOKS) {
		add(b.ko, b.bookid);
		add(b.en, b.bookid);
		for (const a of KO_ABBR[b.bookid] ?? []) add(a, b.bookid);
		for (const a of EN_ABBR[b.bookid] ?? []) add(a, b.bookid);
	}
	return idx;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run`
Expected: PASS (BOOKS + buildAliasIndex describe blocks).

- [ ] **Step 5: Commit**

```bash
git add src/book-data.ts tests/reference-parser.test.ts
git commit -m "feat: add 66-book reference table with KO/EN alias index"
```

---

## Task 4: Reference parser (`src/reference-parser.ts`)

**Files:**
- Create: `src/reference-parser.ts`
- Test: `tests/reference-parser.test.ts` (append)

**Interfaces:**
- Consumes: `BOOKS`, `buildAliasIndex`, `normalizeToken` from `src/book-data`.
- Produces:
  - `interface ParsedRef { bookid: number; chapter: number; verse?: number; }`
  - `function parseReference(query: string): ParsedRef | null` — returns null when no confident book+chapter parse. Clamps chapter to the book's range; drops verse if 0/NaN.
  - `function suggestBooks(query: string, limit?: number): BookMeta[]` — prefix match on the book-portion (text before any trailing number) against ko/en/abbr; returns [] for empty query.

- [ ] **Step 1: Append failing parser tests to `tests/reference-parser.test.ts`**

```ts
import { parseReference, suggestBooks } from "../src/reference-parser";

describe("parseReference", () => {
	it("parses Korean abbrev + chapter without space", () => {
		expect(parseReference("히3")).toEqual({ bookid: 58, chapter: 3 });
	});
	it("parses Korean full name + space + chapter", () => {
		expect(parseReference("히브리서 3")).toEqual({ bookid: 58, chapter: 3 });
	});
	it("parses chapter:verse", () => {
		expect(parseReference("히3:5")).toEqual({ bookid: 58, chapter: 3, verse: 5 });
	});
	it("disambiguates 요일 from 요", () => {
		expect(parseReference("요일3")).toEqual({ bookid: 62, chapter: 3 });
		expect(parseReference("요1")).toEqual({ bookid: 43, chapter: 1 });
		expect(parseReference("요13")).toEqual({ bookid: 43, chapter: 13 });
	});
	it("parses English with leading number", () => {
		expect(parseReference("1 John 3")).toEqual({ bookid: 62, chapter: 3 });
		expect(parseReference("Heb 3")).toEqual({ bookid: 58, chapter: 3 });
	});
	it("clamps chapter above the book max", () => {
		expect(parseReference("유2")).toEqual({ bookid: 65, chapter: 1 }); // Jude has 1 chapter
	});
	it("returns null for unknown or chapterless input", () => {
		expect(parseReference("히브리서")).toBeNull();
		expect(parseReference("zzz 3")).toBeNull();
		expect(parseReference("")).toBeNull();
	});
});

describe("suggestBooks", () => {
	it("prefix-matches Korean", () => {
		const ids = suggestBooks("히").map((b) => b.bookid);
		expect(ids).toContain(58);
	});
	it("prefix-matches English case-insensitively", () => {
		const ids = suggestBooks("jo").map((b) => b.bookid);
		expect(ids).toContain(43); // John
	});
	it("ignores the trailing number when suggesting", () => {
		const ids = suggestBooks("히3").map((b) => b.bookid);
		expect(ids).toContain(58);
	});
	it("returns empty for empty query", () => {
		expect(suggestBooks("")).toEqual([]);
	});
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run`
Expected: FAIL — cannot resolve `../src/reference-parser`.

- [ ] **Step 3: Create `src/reference-parser.ts`**

```ts
import { BOOKS, BookMeta, buildAliasIndex, normalizeToken } from "./book-data";

export interface ParsedRef {
	bookid: number;
	chapter: number;
	verse?: number;
}

const ALIAS = buildAliasIndex();
const BY_ID = new Map<number, BookMeta>(BOOKS.map((b) => [b.bookid, b]));

// Split "<book text><chapter>[:verse]". Book text is everything before the
// final standalone number group. Non-greedy book lets \d+ grab the trailing
// number, so "요일3" → ("요일","3") and "요1" → ("요","1").
const REF_RE = /^(.+?)\s*(\d+)(?::(\d+))?$/;

export function parseReference(query: string): ParsedRef | null {
	const q = query.trim();
	if (!q) return null;
	const m = REF_RE.exec(q);
	if (!m) return null;
	const bookid = ALIAS.get(normalizeToken(m[1]));
	if (!bookid) return null;
	const meta = BY_ID.get(bookid);
	if (!meta) return null;
	let chapter = parseInt(m[2], 10);
	if (!Number.isFinite(chapter) || chapter < 1) chapter = 1;
	if (chapter > meta.chapters) chapter = meta.chapters;
	const ref: ParsedRef = { bookid, chapter };
	if (m[3] !== undefined) {
		const verse = parseInt(m[3], 10);
		if (Number.isFinite(verse) && verse > 0) ref.verse = verse;
	}
	return ref;
}

export function suggestBooks(query: string, limit = 8): BookMeta[] {
	const q = query.trim();
	if (!q) return [];
	// Strip a trailing chapter/verse so "히3" still suggests 히브리서.
	const bookText = q.replace(/\s*\d+(?::\d+)?$/, "").trim() || q;
	const key = normalizeToken(bookText);
	if (!key) return [];
	const out: BookMeta[] = [];
	for (const b of BOOKS) {
		const ko = normalizeToken(b.ko);
		const en = normalizeToken(b.en);
		if (ko.startsWith(key) || en.startsWith(key)) {
			out.push(b);
		}
	}
	// Fallback: alias-prefix match (e.g. abbreviations) when no name matched.
	if (out.length === 0) {
		for (const b of BOOKS) {
			const aliases = [b.ko, b.en];
			void aliases;
		}
		for (const [alias, bookid] of ALIAS) {
			if (alias.startsWith(key)) {
				const meta = BY_ID.get(bookid);
				if (meta && !out.includes(meta)) out.push(meta);
			}
		}
		out.sort((a, b) => a.bookid - b.bookid);
	}
	return out.slice(0, limit);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run`
Expected: PASS (all parseReference + suggestBooks tests).

- [ ] **Step 5: Commit**

```bash
git add src/reference-parser.ts tests/reference-parser.test.ts
git commit -m "feat: add reference parser and book suggestions"
```

---

## Task 5: Bible data source (`src/bible-source.ts`)

**Files:**
- Create: `src/bible-source.ts`
- Test: `tests/reference-parser.test.ts` (append `normalizeLocalChapter` section)

**Interfaces:**
- Consumes: `BOOKS` from `src/book-data`; Obsidian `App`, `requestUrl`, `normalizePath`.
- Produces:
  - `const NKRV_VERSION = "NKRV"` — the local 개역개정 version id.
  - `interface ChapterVerse { verse: number; text: string; }`
  - `interface BookListItem { bookid: number; name: string; chapters: number; }`
  - `function normalizeLocalChapter(raw: unknown, bookid: number, chapter: number): ChapterVerse[]` — pure; accepts either the nested `{ [bookid]: { [chapter]: ChapterVerse[] } }` shape or a flat `Array<{book,chapter,verse,text}>` and returns the verses for the requested chapter.
  - `class BibleSource { constructor(app: App, getNkrvPath: () => string); getBooks(version): Promise<BookListItem[]>; getChapter(version, bookid, chapter): Promise<ChapterVerse[]>; }`

- [ ] **Step 1: Append failing `normalizeLocalChapter` tests**

```ts
import { normalizeLocalChapter } from "../src/bible-source";

describe("normalizeLocalChapter", () => {
	it("reads nested {bookid:{chapter:[...]}} shape", () => {
		const raw = { "58": { "3": [{ verse: 1, text: "그러므로" }] } };
		expect(normalizeLocalChapter(raw, 58, 3)).toEqual([{ verse: 1, text: "그러므로" }]);
	});
	it("reads flat array shape", () => {
		const raw = [
			{ book: 58, chapter: 3, verse: 1, text: "A" },
			{ book: 58, chapter: 3, verse: 2, text: "B" },
			{ book: 58, chapter: 4, verse: 1, text: "C" },
		];
		expect(normalizeLocalChapter(raw, 58, 3)).toEqual([
			{ verse: 1, text: "A" },
			{ verse: 2, text: "B" },
		]);
	});
	it("returns [] when chapter missing", () => {
		expect(normalizeLocalChapter({ "58": {} }, 58, 3)).toEqual([]);
	});
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run`
Expected: FAIL — `normalizeLocalChapter` not exported.

- [ ] **Step 3: Create `src/bible-source.ts`**

```ts
import { App, requestUrl, normalizePath } from "obsidian";
import { BOOKS } from "./book-data";

export const NKRV_VERSION = "NKRV";

export interface ChapterVerse {
	verse: number;
	text: string;
}

export interface BookListItem {
	bookid: number;
	name: string;
	chapters: number;
}

type FlatVerse = { book: number; chapter: number; verse: number; text: string };
type NestedShape = Record<string, Record<string, ChapterVerse[]>>;

export function normalizeLocalChapter(
	raw: unknown,
	bookid: number,
	chapter: number
): ChapterVerse[] {
	if (Array.isArray(raw)) {
		return (raw as FlatVerse[])
			.filter((v) => Number(v.book) === bookid && Number(v.chapter) === chapter)
			.map((v) => ({ verse: Number(v.verse), text: String(v.text) }))
			.sort((a, b) => a.verse - b.verse);
	}
	if (raw && typeof raw === "object") {
		const nested = raw as NestedShape;
		const book = nested[String(bookid)];
		const verses = book?.[String(chapter)];
		if (Array.isArray(verses)) {
			return verses.map((v) => ({ verse: Number(v.verse), text: String(v.text) }));
		}
	}
	return [];
}

export class BibleSource {
	private app: App;
	private getNkrvPath: () => string;
	private nkrvCache: { path: string; data: unknown } | null = null;

	constructor(app: App, getNkrvPath: () => string) {
		this.app = app;
		this.getNkrvPath = getNkrvPath;
	}

	async getBooks(version: string): Promise<BookListItem[]> {
		if (version === NKRV_VERSION) {
			// Static metadata — Korean names from the local book table.
			return BOOKS.map((b) => ({ bookid: b.bookid, name: b.ko, chapters: b.chapters }));
		}
		const res = await requestUrl(`https://bolls.life/get-books/${version}/`);
		return (res.json as BookListItem[]).filter((b) => b.bookid <= 66);
	}

	async getChapter(version: string, bookid: number, chapter: number): Promise<ChapterVerse[]> {
		if (version === NKRV_VERSION) {
			const raw = await this.loadNkrv();
			return normalizeLocalChapter(raw, bookid, chapter);
		}
		const res = await requestUrl(`https://bolls.life/get-chapter/${version}/${bookid}/${chapter}/`);
		return res.json as ChapterVerse[];
	}

	private async loadNkrv(): Promise<unknown> {
		const raw = this.getNkrvPath()?.trim();
		if (!raw) throw new Error("개역개정 JSON 경로가 설정되지 않았습니다.");
		const path = normalizePath(raw);
		if (this.nkrvCache && this.nkrvCache.path === path) return this.nkrvCache.data;
		const exists = await this.app.vault.adapter.exists(path);
		if (!exists) throw new Error(`개역개정 파일을 찾을 수 없습니다: ${path}`);
		const text = await this.app.vault.adapter.read(path);
		const data = JSON.parse(text);
		this.nkrvCache = { path, data };
		return data;
	}

	clearNkrvCache(): void {
		this.nkrvCache = null;
	}
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run`
Expected: PASS. (The `obsidian` import is only used by the class, not by `normalizeLocalChapter`; vitest resolves the module but the pure function is tree-independent. If vitest fails to resolve `obsidian`, add the alias in Step 5.)

- [ ] **Step 5: If `obsidian` import breaks vitest, stub it**

Only if Step 4 errors on resolving `obsidian`, add to `vitest.config.mjs` under `test`:

```js
		alias: { obsidian: new URL("./tests/obsidian-stub.ts", import.meta.url).pathname },
```

And create `tests/obsidian-stub.ts`:

```ts
export const requestUrl = async () => ({ json: [] });
export const normalizePath = (p: string) => p;
export class App {}
```

Re-run `npx vitest run` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/bible-source.ts tests/reference-parser.test.ts vitest.config.mjs tests/obsidian-stub.ts
git commit -m "feat: add BibleSource (bolls API + local NKRV) with chapter normalizer"
```

---

## Task 6: Settings rewrite (`settings.ts`)

**Files:**
- Modify: `settings.ts` (full replacement of `display()` body)

**Interfaces:**
- Consumes: `this.plugin.settings` with new field `nkrvPath: string`; `NKRV_VERSION` from `src/bible-source`.
- Produces: settings UI with a 4-option version dropdown, an 개역개정 path text field, and Koreanized copy settings. On change, calls `this.plugin.saveSettings()`.

- [ ] **Step 1: Replace `settings.ts` contents**

```ts
import BibleSidecarPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import { NKRV_VERSION } from "./src/bible-source";

export class BibleSidecarSettingsTab extends PluginSettingTab {
	plugin: BibleSidecarPlugin;
	containerEl: HTMLElement;
	constructor(app: App, plugin: BibleSidecarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("성경 역본")
			.setDesc("사이드바에 표시할 성경 역본을 선택하세요")
			.addDropdown((dropdown) => {
				dropdown.addOption("KRV", "개역한글");
				dropdown.addOption(NKRV_VERSION, "개역개정 (로컬 파일)");
				dropdown.addOption("NIV", "NIV (New International Version, 1984)");
				dropdown.addOption("KJV", "KJV (King James Version)");
				dropdown
					.setValue(this.plugin.settings.bibleVersion)
					.onChange((value) => {
						this.plugin.settings.bibleVersion = value;
						this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(containerEl)
			.setName("개역개정 JSON 경로")
			.setDesc(
				"개역개정 본문 JSON 파일의 vault 내 경로 (예: bible/nkrv.json). 저작권 보호 본문이므로 직접 준비해 vault에 넣어 주세요."
			)
			.addText((text) => {
				text
					.setPlaceholder("bible/nkrv.json")
					.setValue(this.plugin.settings.nkrvPath)
					.onChange((value) => {
						this.plugin.settings.nkrvPath = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("복사 형식")
			.setHeading()
			.setDesc("성경 본문을 복사할 때의 형식을 선택하세요")
			.addDropdown((dropdown) => {
				dropdown.addOption("plain", "일반 텍스트");
				dropdown.addOption("callout", "콜아웃 (Callout)");
				dropdown
					.setValue(this.plugin.settings.copyFormat)
					.onChange((value) => {
						this.plugin.settings.copyFormat = value;
						this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("구절 출처 포함")
			.setHeading()
			.setDesc("복사할 때 구절 출처(예: 히브리서 3:1)를 포함합니다 (권장)")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.copyVerseReference)
					.onChange((value) => {
						this.plugin.settings.copyVerseReference = value;
						this.plugin.saveSettings();
						this.display();
					});
			});

		if (this.plugin.settings.copyVerseReference) {
			new Setting(containerEl)
				.setName("구절 출처 스타일")
				.setDesc("구절 출처 줄의 스타일을 선택하세요")
				.addDropdown((dropdown) => {
					dropdown.addOption("- ", "목록 (-)");
					dropdown.addOption(">", "콜아웃 (>)");
					dropdown.addOption("-- ", "이중 대시 (--)");
					dropdown.addOption("~", "물결 (~)");
					dropdown
						.setValue(this.plugin.settings.verseReferenceStyle)
						.onChange((value) => {
							this.plugin.settings.verseReferenceStyle = value;
							this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName("내부 링크 사용 (예: [[요한복음]])")
				.setDesc("구절 출처의 책 이름을 위키링크로 감쌉니다")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.verseReferenceInternalLinking)
						.onChange((value) => {
							this.plugin.settings.verseReferenceInternalLinking = value;
							this.plugin.saveSettings();
						});
				});
		}
	}
}
```

- [ ] **Step 2: Build to typecheck**

Run: `npm run build`
Expected: PASS once Task 7 is also applied. (If run alone, may error on `nkrvPath` — proceed to Task 7 then build.)

- [ ] **Step 3: Commit**

```bash
git add settings.ts
git commit -m "feat: Korean settings UI with 4 versions and NKRV path"
```

---

## Task 7: Plugin core (`main.ts`)

**Files:**
- Modify: `main.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `BibleSidecarSettings` with `nkrvPath: string` and without language logic; `DEFAULT_SETTINGS.bibleVersion = "KRV"`. `saveSettings()` still calls `updateBibleViewSettings`.

- [ ] **Step 1: Replace the settings interface + defaults + loadSettings in `main.ts`**

Replace the `BibleSidecarSettings` interface (lines ~8–17) with:

```ts
interface BibleSidecarSettings {
	bibleVersion: string;
	nkrvPath: string;
	copyFormat: string;
	copyVerseReference: boolean;
	verseReferenceStyle: string;
	verseReferenceFormat: string;
	verseReferenceInternalLinking: boolean;
	verseReferenceInternalLinkingFormat: string;
}
```

Replace `DEFAULT_SETTINGS` and remove `LANGUAGE_DEFAULT_VERSIONS`:

```ts
const DEFAULT_SETTINGS: Partial<BibleSidecarSettings> = {
	bibleVersion: "KRV",
	nkrvPath: "",
	copyFormat: "plain",
	copyVerseReference: false,
	verseReferenceStyle: "- ",
	verseReferenceFormat: "full",
	verseReferenceInternalLinking: false,
	verseReferenceInternalLinkingFormat: "short",
};
```

Replace `loadSettings()` with a plain merge (no language remap):

```ts
	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}
```

- [ ] **Step 2: Update the ribbon/command labels to Korean (optional but consistent)**

Change the ribbon tooltip and command name strings to `"성경 사이드바"` / `"성경 사이드바 열기"`. Leave the command `id` (`open-bible-sidecar`) unchanged.

- [ ] **Step 3: Build to typecheck**

Run: `npm run build`
Expected: PASS (with Task 6 + Task 8 applied). Fix any type errors surfaced.

- [ ] **Step 4: Commit**

```bash
git add main.ts
git commit -m "feat: KRV default, nkrvPath setting, drop language remap"
```

---

## Task 8: BibleView — search box, autocomplete, verse jump, Koreanized UI (`BibleView.ts`)

**Files:**
- Modify: `BibleView.ts`

**Interfaces:**
- Consumes: `BibleSource`, `NKRV_VERSION`, `ChapterVerse`, `BookListItem` from `src/bible-source`; `parseReference`, `suggestBooks` from `src/reference-parser`; `BOOKS` from `src/book-data`.
- Produces: a view whose `loadBible()` renders a persistent top search box followed by the book browse list; `openChapter(bookid, chapter, verse?)` navigates and optionally scrolls/highlights a verse.

- [ ] **Step 1: Update imports and `BibleSidecarSettings` in `BibleView.ts`**

At the top, add to the obsidian import and new module imports; add `nkrvPath` to the local settings interface and create a `source` field:

```ts
import { ItemView, WorkspaceLeaf, Notice, Platform } from "obsidian";
import { BibleSource, NKRV_VERSION, ChapterVerse, BookListItem } from "./src/bible-source";
import { parseReference, suggestBooks } from "./src/reference-parser";
import { BOOKS } from "./src/book-data";
```

In `interface BibleSidecarSettings`, add `nkrvPath: string;` and remove `bibleLanguage`. In `DEFAULT_SETTINGS` set `bibleVersion: "KRV"`, add `nkrvPath: ""`, remove `bibleLanguage`.

Add a field and lazily build the source:

```ts
	source: BibleSource;
```

In `load()`, after the settings assign, initialize the source:

```ts
		this.source = new BibleSource(this.app, () => this.settings.nkrvPath);
```

- [ ] **Step 2: Replace `generateBibleBooks` / `getChapterContent` with source calls**

Delete `generateBibleBooks()` and `getChapterContent()`. Replace their call sites:
- In `loadBible()`: `const books = await this.source.getBooks(this.settings.bibleVersion);`
- Everywhere `await this.getChapterContent(this.settings.bibleVersion, X, Y)` → `await this.source.getChapter(this.settings.bibleVersion, X, Y)`.

Wrap chapter fetches that may hit the missing NKRV file in try/catch that shows the error message:

```ts
		try {
			const chapterContentArray = await this.source.getChapter(
				this.settings.bibleVersion, book.bookid, i
			);
			chapterContainer.empty();
			this.processChapterContent(chapterContentArray, chapterContainer, book, i, books);
		} catch (e) {
			new Notice(String(e instanceof Error ? e.message : e));
		}
```

- [ ] **Step 3: Add the search box to `renderBooks` (top, persistent)**

At the start of `renderBooks`, before the book buttons, build a search container. Replace the opening of `renderBooks` so it renders search first:

```ts
	renderBooks(books: BookListItem[]) {
		const { containerEl } = this;
		containerEl.empty();

		const wrapper = containerEl.createEl("div", { cls: "bible-wrapper" });
		this.renderSearchBox(wrapper, books);

		const chapterContainer = wrapper.createEl("div", { cls: "chapter-container" });
		chapterContainer.createEl("div", { cls: "chapter-content" });

		for (const book of books) {
			if (book.bookid === 1) {
				chapterContainer.createEl("h4", { text: "구약", cls: "book-divider" });
			}
			if (book.bookid === 40) {
				chapterContainer.createEl("hr", { cls: "book-divider" });
				chapterContainer.createEl("h4", { text: "신약", cls: "book-divider" });
			}
			chapterContainer
				.createEl("button", { text: book.name, attr: { id: String(book.bookid) } })
				.addEventListener("click", async () => {
					await this.renderChapters(book, chapterContainer, books);
				});
		}
	}
```

- [ ] **Step 4: Implement `renderSearchBox` with autocomplete + Enter**

Add this method. It builds an input + a suggestions `<div>`; typing updates suggestions from `suggestBooks`; Enter parses via `parseReference` and navigates; clicking a suggestion fills chapter 1 (or the typed chapter) and navigates.

```ts
	renderSearchBox(parent: HTMLElement, books: BookListItem[]) {
		const box = parent.createEl("div", { cls: "bible-search" });
		const input = box.createEl("input", {
			cls: "bible-search-input",
			attr: { type: "text", placeholder: "검색: 히3, 히브리서 3, 히3:5, Heb 3" },
		});
		const list = box.createEl("div", { cls: "bible-search-suggestions" });

		const go = (query: string) => {
			const ref = parseReference(query);
			if (!ref) {
				new Notice("책/장을 인식할 수 없습니다. 예: 히3, 히브리서 3, 히3:5");
				return;
			}
			list.empty();
			this.openChapter(ref.bookid, ref.chapter, ref.verse, books);
		};

		input.addEventListener("input", () => {
			const q = input.value;
			list.empty();
			if (!q.trim()) return;
			// trailing chapter (and optional verse) to carry into the click
			const numMatch = q.match(/(\d+)(?::(\d+))?\s*$/);
			const chapter = numMatch ? parseInt(numMatch[1], 10) : 1;
			const verse = numMatch && numMatch[2] ? parseInt(numMatch[2], 10) : undefined;
			for (const b of suggestBooks(q)) {
				const item = list.createEl("div", {
					cls: "bible-search-suggestion",
					text: `${b.ko} (${b.en})`,
				});
				item.addEventListener("click", () => {
					input.value = "";
					list.empty();
					this.openChapter(b.bookid, Math.min(chapter, b.chapters), verse, books);
				});
			}
		});

		input.addEventListener("keydown", (evt: KeyboardEvent) => {
			if (evt.key === "Enter") {
				evt.preventDefault();
				go(input.value);
			}
		});
	}
```

- [ ] **Step 5: Implement `openChapter` (navigate + verse jump)**

Add a method that resolves the `BookListItem` for a bookid, renders that chapter into the existing chapter container, and scrolls/highlights the verse if given. It reuses `processChapterContent`.

```ts
	async openChapter(
		bookid: number,
		chapter: number,
		verse: number | undefined,
		books: BookListItem[]
	) {
		const book = books.find((b) => b.bookid === bookid)
			?? { bookid, name: BOOKS[bookid - 1]?.ko ?? String(bookid), chapters: BOOKS[bookid - 1]?.chapters ?? 1 };
		const wrapper = this.containerEl.querySelector(".bible-wrapper") as HTMLElement;
		const chapterContainer = wrapper?.querySelector(".chapter-container") as HTMLElement
			?? this.containerEl.querySelector(".chapter-container") as HTMLElement;
		if (!chapterContainer) return;
		try {
			const verses = await this.source.getChapter(this.settings.bibleVersion, bookid, chapter);
			chapterContainer.empty();
			this.processChapterContent(verses, chapterContainer, book, chapter, books);
			if (verse !== undefined) this.scrollToVerse(chapterContainer, verse);
		} catch (e) {
			new Notice(String(e instanceof Error ? e.message : e));
		}
	}

	scrollToVerse(container: HTMLElement, verse: number) {
		const spans = Array.from(container.querySelectorAll(".verse")) as HTMLElement[];
		const target = spans[verse - 1];
		if (!target) return;
		target.scrollIntoView({ behavior: "smooth", block: "center" });
		target.classList.add("verse-highlight");
		window.setTimeout(() => target.classList.remove("verse-highlight"), 2500);
	}
```

- [ ] **Step 6: Koreanize the remaining UI strings**

In `renderChapters` and `processChapterContent`, replace button texts:
- `"Books"` / `"Back to books"` → `"책 목록"`
- `"Previous"` / `"Previous chapter"` → `"이전 장"`
- `"Next"` / `"Next chapter"` → `"다음 장"`
- `"Back"` → `"뒤로"`

In `renderCopyMessage`, change the Notice to Korean:

```ts
				new Notice(`${book.name} ${chapter}:${verse.verse} 복사됨`);
```

Update method signatures that referenced the old book type to use `BookListItem` for consistency (e.g. `renderChapters(book: BookListItem, ...)`, `processChapterContent(chapter: ChapterVerse[], ...)`).

- [ ] **Step 7: Build to typecheck**

Run: `npm run build`
Expected: PASS. Resolve any type mismatches (book type, verse type).

- [ ] **Step 8: Commit**

```bash
git add BibleView.ts
git commit -m "feat: top search with autocomplete, verse jump, Korean UI"
```

---

## Task 9: Styles (`styles.css`)

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes: class names `bible-search`, `bible-search-input`, `bible-search-suggestions`, `bible-search-suggestion`, `verse-highlight` from Task 8.
- Produces: styling only.

- [ ] **Step 1: Append styles**

```css
[data-type="bible-view"] .bible-search {
	position: sticky;
	top: 0;
	z-index: 2;
	background: var(--background-primary);
	padding: 8px;
	border-bottom: 1px solid var(--background-modifier-border);
}
[data-type="bible-view"] .bible-search-input {
	width: 100%;
	box-sizing: border-box;
}
[data-type="bible-view"] .bible-search-suggestions {
	display: flex;
	flex-direction: column;
}
[data-type="bible-view"] .bible-search-suggestion {
	padding: 4px 6px;
	cursor: pointer;
	border-radius: 4px;
}
[data-type="bible-view"] .bible-search-suggestion:hover {
	background: var(--background-modifier-hover);
}
[data-type="bible-view"] .verse-highlight {
	background: var(--text-highlight-bg);
	transition: background 0.4s ease;
}
```

- [ ] **Step 2: Build (sanity)**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "style: search box, suggestions, verse highlight"
```

---

## Task 10: NKRV converter script + sample format

**Files:**
- Create: `scripts/convert-nkrv.mjs`

**Interfaces:**
- Consumes: an input JSON path (flat verse array) + output path, via argv.
- Produces: the nested `{ [bookid]: { [chapter]: [{verse,text}] } }` file the loader prefers.

- [ ] **Step 1: Create `scripts/convert-nkrv.mjs`**

```js
// Usage: node scripts/convert-nkrv.mjs input.json output.json
// input.json: Array<{book:number, chapter:number, verse:number, text:string}>
// output.json: { "<book>": { "<chapter>": [ {verse,text}, ... ] } }
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
	console.error("Usage: node scripts/convert-nkrv.mjs input.json output.json");
	process.exit(1);
}

const raw = JSON.parse(readFileSync(inPath, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.verses;
if (!Array.isArray(rows)) {
	console.error("Input must be an array or have a 'verses' array.");
	process.exit(1);
}

const out = {};
for (const r of rows) {
	const book = String(r.book ?? r.bookid);
	const chapter = String(r.chapter);
	(out[book] ??= {});
	(out[book][chapter] ??= []).push({ verse: Number(r.verse), text: String(r.text) });
}
for (const book of Object.values(out)) {
	for (const ch of Object.values(book)) ch.sort((a, b) => a.verse - b.verse);
}
writeFileSync(outPath, JSON.stringify(out));
console.log(`Wrote ${outPath}`);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/convert-nkrv.mjs
git commit -m "chore: add NKRV JSON converter script"
```

---

## Task 11: README + release docs + final build verification

**Files:**
- Modify: `README.md`
- Create: `docs/RELEASE.md`

**Interfaces:**
- Consumes: final manifest/version from Task 1.
- Produces: user-facing docs; no code.

- [ ] **Step 1: Rewrite `README.md`** (Korean) covering: what it is, the 4 versions, that 개역개정 needs a user-supplied `nkrv.json` (with the expected format + converter usage), the search syntax (`히3`, `히브리서 3`, `히3:5`, `Heb 3`), install via community store / manual, and a **Credits** section crediting Janis Ringli's original plugin + the MIT license + that text comes from the bolls.life API.

- [ ] **Step 2: Create `docs/RELEASE.md`** — community-store submission checklist:
  - `manifest.json` at repo root, accurate, committed to default branch.
  - Build artifacts `main.js`, `manifest.json`, `styles.css` attached to a GitHub Release whose **tag = `1.0.0`** (no `v`).
  - `versions.json` maps `1.0.0` → `0.15.0`.
  - Open PR to `obsidianmd/obsidian-releases` adding an entry to `community-plugins.json` with id `bible-sidecar-kr`.
  - Note: 개역개정 text is NOT bundled (copyright); plugin degrades gracefully without it so reviewers can test.

- [ ] **Step 3: Full verification**

Run: `npm run build && npm test`
Expected: build emits `main.js` with no tsc errors; vitest reports all tests passing.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/RELEASE.md
git commit -m "docs: Korean README and community-store release guide"
```

---

## Self-Review notes

- **Spec coverage:** 4 versions (Task 6/7), 개역개정 local (Task 5/6), top search w/ autocomplete + Enter (Task 8), verse jump (Task 8), KO+EN parsing (Task 3/4), Korean UI (Task 6/8), fork+MIT (Task 1), build verify (Task 11), store release (Task 11). ✓
- **Type consistency:** `BookListItem`/`ChapterVerse` are the shared types from `bible-source` and are used uniformly in `BibleView` (Task 8 Step 6 migrates the old inline types). `parseReference` returns `{bookid,chapter,verse?}` consumed by `openChapter`. ✓
- **Graceful NKRV absence:** `loadNkrv` throws a Korean message; all call sites (Task 8 Step 2/5) wrap in try/catch → Notice. ✓
- **Open risk:** vitest resolving the `obsidian` import in `bible-source.ts` — mitigated by the stub in Task 5 Step 5 (apply only if needed).
