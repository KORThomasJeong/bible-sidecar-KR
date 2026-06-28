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
// number, so "요일3" -> ("요일","3") and "요1" -> ("요","1").
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

// "27-28,30" — consecutive verses collapse to ranges, gaps split on commas.
export function compactVerseRef(verses: number[]): string {
	const s = [...verses].sort((a, b) => a - b);
	if (s.length === 0) return "";
	const parts: string[] = [];
	let start = s[0];
	let prev = s[0];
	for (let k = 1; k < s.length; k++) {
		if (s[k] === prev + 1) {
			prev = s[k];
			continue;
		}
		parts.push(start === prev ? `${start}` : `${start}-${prev}`);
		start = prev = s[k];
	}
	parts.push(start === prev ? `${start}` : `${start}-${prev}`);
	return parts.join(",");
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
