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

type FlatVerse = { book?: number; bookid?: number; chapter: number; verse: number; text: string };
type NestedShape = Record<string, Record<string, ChapterVerse[]>>;

export function normalizeLocalChapter(
	raw: unknown,
	bookid: number,
	chapter: number
): ChapterVerse[] {
	if (Array.isArray(raw)) {
		return (raw as FlatVerse[])
			.filter(
				(v) => Number(v.book ?? v.bookid) === bookid && Number(v.chapter) === chapter
			)
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

	async getChapter(
		version: string,
		bookid: number,
		chapter: number
	): Promise<ChapterVerse[]> {
		if (version === NKRV_VERSION) {
			const raw = await this.loadNkrv();
			return normalizeLocalChapter(raw, bookid, chapter);
		}
		const res = await requestUrl(
			`https://bolls.life/get-chapter/${version}/${bookid}/${chapter}/`
		);
		return res.json as ChapterVerse[];
	}

	private async loadNkrv(): Promise<unknown> {
		const raw = this.getNkrvPath()?.trim();
		if (!raw) throw new Error("개역개정 JSON 경로가 설정되지 않았습니다. 설정에서 경로를 지정하세요.");
		const path = normalizePath(raw);
		if (this.nkrvCache && this.nkrvCache.path === path) return this.nkrvCache.data;
		const exists = await this.app.vault.adapter.exists(path);
		if (!exists) throw new Error(`개역개정 파일을 찾을 수 없습니다: ${path}`);
		const text = await this.app.vault.adapter.read(path);
		const data: unknown = JSON.parse(text);
		this.nkrvCache = { path, data };
		return data;
	}

	clearNkrvCache(): void {
		this.nkrvCache = null;
	}
}
