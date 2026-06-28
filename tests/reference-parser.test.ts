import { describe, it, expect } from "vitest";
import { BOOKS, buildAliasIndex, normalizeToken } from "../src/book-data";
import { parseReference, suggestBooks } from "../src/reference-parser";
import { normalizeLocalChapter } from "../src/bible-source";

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
