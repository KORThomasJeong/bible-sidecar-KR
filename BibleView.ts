import { ItemView, WorkspaceLeaf, Notice, Platform } from "obsidian";
import { BibleSource, ChapterVerse, BookListItem } from "./src/bible-source";
import { parseReference, suggestBooks } from "./src/reference-parser";
import { BOOKS } from "./src/book-data";

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

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return BibleViewType;
	}

	getDisplayText() {
		return "Bible Sidecar KR";
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
		this.loadBible();
	}

	async onOpen() {
		this.loadBible();
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
			(digit: keyof typeof superscriptMap) => superscriptMap[digit]
		);
		return superscriptedDigits.join("");
	}

	convertToNumber(superscriptNumber: string): number {
		const superscriptMap = {
			"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
			"⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
		};
		const digits = superscriptNumber
			.split("")
			.map((digit) => superscriptMap[digit as keyof typeof superscriptMap]);
		return parseInt(digits.join(""), 10);
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
			this.openChapter(ref.bookid, ref.chapter, ref.verse, books);
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
		const wrapper = this.containerEl.querySelector(".bible-wrapper") as HTMLElement | null;
		const chapterContainer =
			(wrapper?.querySelector(".chapter-container") as HTMLElement | null) ??
			(this.containerEl.querySelector(".chapter-container") as HTMLElement | null);
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
			this.onOpen();
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
			this.onOpen();
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

		const chapterContent = chapterContainer.createEl("div", { cls: "chapter-content" });
		chapterContent.empty();

		let accumulatedVerseText = "";

		function filterVerse(verse: string): string {
			return verse.replace(/<br\s*\/?>|<\/?i>|<\/?b>/gi, "\n");
		}

		for (const verse of chapter) {
			const formattedVerseNumber = this.convertToSuperscript(String(verse.verse));
			const filteredVerseText = filterVerse(verse.text);

			const formattedVerse = chapterContent.createEl("span", { cls: "verse" });
			formattedVerse.appendChild(
				document.createTextNode(`${formattedVerseNumber} ${filteredVerseText}`)
			);

			formattedVerse.addEventListener("click", () => {
				formattedVerse.classList.toggle("active-verse");
				const verseIdentifier = `${formattedVerseNumber} ${verse.text}`;
				if (formattedVerse.classList.contains("active-verse")) {
					accumulatedVerseText += verseIdentifier + " ";
				} else {
					accumulatedVerseText = accumulatedVerseText.replace(verseIdentifier + " ", "");
				}
				this.renderCopyMessage(book, i, accumulatedVerseText);
			});

			chapterContent.appendChild(formattedVerse);
		}
	}

	renderCopyMessage(
		book: BookListItem,
		chapter: number,
		accumulatedVerseText: string
	) {
		const regex = /[⁰¹²³⁴-⁹]+/g;
		const verses = accumulatedVerseText
			.split("\n")
			.flatMap((verse) => {
				const matches = Array.from(verse.matchAll(regex));
				if (matches.length === 0) {
					return [{ verse: 0, text: verse.trim() }];
				}
				return matches.map((match) => {
					const verseNumber = this.convertToNumber(match[0]);
					const verseStart = (match?.index ?? 0) + (match?.[0]?.length ?? 0);
					const verseEnd =
						matches.indexOf(match) === matches.length - 1
							? verse.length
							: Array.from(verse.matchAll(regex))[matches.indexOf(match) + 1].index;
					const verseText = verse.substring(verseStart, verseEnd).trim();
					return { verse: verseNumber, text: verseText };
				});
			})
			.sort((a, b) => (a?.verse ?? 0) - (b?.verse ?? 0));

		for (const verse of verses) {
			let verseRangeStart = 0;
			let verseRangeEnd = 0;
			let sortedText = "";
			const internalLinkStart =
				this.settings.verseReferenceInternalLinking === true
					? `[[${book.name}]]`
					: `${book.name}`;

			verses.forEach((verse, index) => {
				if (verseRangeStart === 0) {
					verseRangeStart = verse.verse;
				}
				if (index > 0 && verses[index - 1].verse !== verse.verse - 1) {
					verseRangeEnd = verses[index - 1].verse;
					if (this.settings.copyVerseReference) {
						sortedText += ` \n${this.settings.copyFormat === "callout" ? "> " : ""}${this.settings.verseReferenceStyle} ${internalLinkStart} ${chapter}:${
							verseRangeStart === verseRangeEnd
								? verseRangeStart
								: verseRangeStart + "-" + verseRangeEnd
						}  \n\n`;
					}
					verseRangeStart = verse.verse;
				}

				sortedText += `${this.settings.copyFormat === "callout" ? "> " : ""}${this.convertToSuperscript(
					verse.verse.toString()
				)} ${verse.text}`;

				if (index === verses.length - 1) {
					verseRangeEnd = verse.verse;
					if (this.settings.copyVerseReference) {
						sortedText += ` \n${this.settings.copyFormat === "callout" ? "> " : ""}${this.settings.verseReferenceStyle} ${internalLinkStart} ${chapter}:${
							verseRangeStart === verseRangeEnd
								? verseRangeStart
								: verseRangeStart + "-" + verseRangeEnd
						} `;
					}
				}
			});

			navigator.clipboard.writeText(sortedText.trim());
			new Notice(`${book.name} ${chapter}:${verse.verse} 복사됨`);
		}
	}
}
