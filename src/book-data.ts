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

// Korean abbreviations (개역 계열 표준 약칭), bookid-indexed.
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
