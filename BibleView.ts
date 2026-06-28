import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { BibleSource, NKRV_VERSION, ChapterVerse, BookListItem } from "./src/bible-source";
import { parseReference, suggestBooks, compactVerseRef } from "./src/reference-parser";
import { BOOKS, getAbbreviation } from "./src/book-data";

export const BibleViewType = "bible-view";

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

const DEFAULT_SETTINGS: Partial<BibleSidecarSettings> = {
	bibleVersion: "KRV",
	nkrvPath: "",
	copyFormat: "plain",
	copyVerseReference: false,
	verseReferenceStyle: "- ",
	verseReferenceFormat: "full",
	verseReferenceInternalLinking: false,
};

export class BibleView extends ItemView {
	settings: BibleSidecarSettings;
	source: BibleSource;
	backButton: HTMLElement;
	previousButton: HTMLElement;
	nextButton: HTMLElement;

	// Selection state for the currently displayed chapter.
	private selected = new Map<number, string>(); // verse number -> verse text
	private selectionToolbar: HTMLElement | null = null;
	private selectionCountEl: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	private clearSelection() {
		this.selected.clear();
		const active = this.containerEl.querySelectorAll(".verse.active-verse");
		active.forEach((el) => el.removeClass("active-verse"));
		this.updateSelectionToolbar();
	}

	getViewType() {
		return BibleViewType;
	}

	getDisplayText() {
		return "성경 사이드바";
	}

	getIcon() {
		return "book-open-text";
	}

	public load(): void {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, this.settings);
		this.source = new BibleSource(this.app, () => this.settings.nkrvPath);
		super.load();
	}

	public updateSettings(newSettings: BibleSidecarSettings): void {
		this.settings = newSettings;
		this.source?.clearNkrvCache();
		void this.loadBible();
	}

	async onOpen() {
		await this.loadBible();
	}

	async loadBible() {
		try {
			const books = await this.source.getBooks(this.settings.bibleVersion);
			this.renderBooks(books);
		} catch (e) {
			new Notice(String(e instanceof Error ? e.message : e));
		}
	}

	convertToSuperscript(number: string): string {
		const superscriptMap = {
			"0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
			"5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
		};
		const digits = String(number).split("");
		const superscriptedDigits = digits.map(
			(digit) => superscriptMap[digit as keyof typeof superscriptMap]
		);
		return superscriptedDigits.join("");
	}

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
			void this.openChapter(ref.bookid, ref.chapter, ref.verse, books);
		};

		input.addEventListener("input", () => {
			const q = input.value;
			list.empty();
			if (!q.trim()) return;
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
					void this.openChapter(b.bookid, Math.min(chapter, b.chapters), verse, books);
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

	async openChapter(
		bookid: number,
		chapter: number,
		verse: number | undefined,
		books: BookListItem[]
	) {
		const meta = BOOKS[bookid - 1];
		const book: BookListItem =
			books.find((b) => b.bookid === bookid) ?? {
				bookid,
				name: meta?.ko ?? String(bookid),
				chapters: meta?.chapters ?? 1,
			};
		const wrapper = this.containerEl.querySelector<HTMLElement>(".bible-wrapper");
		const chapterContainer =
			wrapper?.querySelector<HTMLElement>(".chapter-container") ??
			this.containerEl.querySelector<HTMLElement>(".chapter-container");
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
		const spans = Array.from(container.querySelectorAll<HTMLElement>(".verse"));
		const target = spans[verse - 1];
		if (!target) return;
		target.scrollIntoView({ behavior: "smooth", block: "center" });
		target.classList.add("verse-highlight");
		window.setTimeout(() => target.classList.remove("verse-highlight"), 2500);
	}

	async renderChapters(
		book: BookListItem,
		chapterContainer: HTMLElement,
		books: BookListItem[]
	) {
		chapterContainer.empty();

		const header = chapterContainer.createDiv({ cls: "bible-header" });
		chapterContainer.createDiv({ cls: "controls-container" });

		this.backButton = header.createEl("button", {
			text: "책 목록",
			cls: "back-button",
		});
		this.backButton.addEventListener("click", () => {
			void this.onOpen();
		});

		for (let i = 1; i <= book.chapters; i++) {
			chapterContainer
				.createEl("button", { text: i.toString(), cls: "chapter-button" })
				.addEventListener("click", async () => {
					try {
						const chapterContentArray = await this.source.getChapter(
							this.settings.bibleVersion,
							book.bookid,
							i
						);
						chapterContainer.empty();
						this.processChapterContent(chapterContentArray, chapterContainer, book, i, books);
					} catch (e) {
						new Notice(String(e instanceof Error ? e.message : e));
					}
				});
		}
	}

	processChapterContent(
		chapter: ChapterVerse[],
		chapterContainer: HTMLElement,
		book: BookListItem,
		i: number,
		books: BookListItem[]
	) {
		chapterContainer.createEl("h2", { text: `${book.name} ${i}` });
		const controlsContainer = chapterContainer.createDiv({ cls: "controls-container" });

		this.previousButton = controlsContainer.createEl("button", {
			text: "이전 장",
			cls: "previous-button",
		});
		this.previousButton.addEventListener("click", async () => {
			const newChapter = i - 1;
			if (newChapter < 1) return;
			try {
				const previousChapterContent = await this.source.getChapter(
					this.settings.bibleVersion,
					book.bookid,
					newChapter
				);
				chapterContainer.empty();
				this.processChapterContent(previousChapterContent, chapterContainer, book, newChapter, books);
			} catch (e) {
				new Notice(String(e instanceof Error ? e.message : e));
			}
		});

		this.backButton = controlsContainer.createEl("button", {
			text: "책 목록",
			cls: "back-button",
		});
		this.backButton.addEventListener("click", () => {
			void this.onOpen();
		});

		this.nextButton = controlsContainer.createEl("button", {
			text: "다음 장",
			cls: "next-button",
		});
		this.nextButton.addEventListener("click", async () => {
			let newChapter = i + 1;
			let targetBook = book;
			if (newChapter > book.chapters) {
				const newBook = books.find((b) => b.bookid === book.bookid + 1);
				if (!newBook) return; // already at the last book
				targetBook = newBook;
				newChapter = 1;
			}
			try {
				const nextChapterContent = await this.source.getChapter(
					this.settings.bibleVersion,
					targetBook.bookid,
					newChapter
				);
				chapterContainer.empty();
				this.processChapterContent(nextChapterContent, chapterContainer, targetBook, newChapter, books);
			} catch (e) {
				new Notice(String(e instanceof Error ? e.message : e));
			}
		});

		// New chapter view → reset selection.
		this.selected.clear();

		const chapterContent = chapterContainer.createEl("div", { cls: "chapter-content" });

		function filterVerse(verse: string): string {
			return verse.replace(/<br\s*\/?>|<\/?i>|<\/?b>/gi, "\n");
		}

		for (const verse of chapter) {
			const filteredVerseText = filterVerse(verse.text);
			const formattedVerse = chapterContent.createEl("span", { cls: "verse" });
			formattedVerse.appendText(
				`${this.convertToSuperscript(String(verse.verse))} ${filteredVerseText}`
			);

			formattedVerse.addEventListener("click", () => {
				if (this.selected.has(verse.verse)) {
					this.selected.delete(verse.verse);
					formattedVerse.removeClass("active-verse");
				} else {
					this.selected.set(verse.verse, filteredVerseText);
					formattedVerse.addClass("active-verse");
				}
				this.updateSelectionToolbar();
			});
		}

		// Selection toolbar (sticky bottom action bar), shown when >=1 verse selected.
		const toolbar = chapterContainer.createDiv({ cls: "selection-toolbar" });
		toolbar.hide();
		this.selectionToolbar = toolbar;
		const copyBtn = toolbar.createEl("button", { text: "복사", cls: "copy-button" });
		const clearBtn = toolbar.createEl("button", { cls: "clear-button" });
		this.selectionCountEl = clearBtn;
		copyBtn.addEventListener("click", () => {
			const text = this.buildCopyText(book, i);
			if (!text) return;
			void navigator.clipboard.writeText(text);
			new Notice(`${this.selected.size}개 절 복사됨`);
		});
		clearBtn.addEventListener("click", () => this.clearSelection());
		this.updateSelectionToolbar();
	}

	private updateSelectionToolbar() {
		if (!this.selectionToolbar) return;
		const n = this.selected.size;
		this.selectionCountEl?.setText(`선택 해제 (${n})`);
		if (n > 0) this.selectionToolbar.show();
		else this.selectionToolbar.hide();
	}

	private buildCopyText(book: BookListItem, chapter: number): string {
		const nums = [...this.selected.keys()].sort((a, b) => a - b);
		if (nums.length === 0) return "";
		const ref = compactVerseRef(nums);
		const line = (v: number) =>
			`${v} ${(this.selected.get(v) ?? "").replace(/\s*\n+\s*/g, " ").trim()}`;

		if (this.settings.copyFormat === "callout") {
			const isKo =
				this.settings.bibleVersion === "KRV" ||
				this.settings.bibleVersion === NKRV_VERSION;
			const abbr = getAbbreviation(book.bookid, isKo ? "ko" : "en");
			const body = nums.map((v) => `> ${line(v)}`).join("\n");
			return `>[!${abbr}${chapter}:${ref}]\n${body}`;
		}

		const body = nums.map(line).join("\n");
		if (this.settings.copyVerseReference) {
			const name = this.settings.verseReferenceInternalLinking
				? `[[${book.name}]]`
				: book.name;
			const refLine = `${this.settings.verseReferenceStyle.trim()} ${name} ${chapter}:${ref}`;
			return `${refLine}\n${body}`;
		}
		return body;
	}
}
