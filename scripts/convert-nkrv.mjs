// Usage: node scripts/convert-nkrv.mjs input.json output.json
// input.json: Array<{book:number, chapter:number, verse:number, text:string}>
//             (also accepts { "verses": [ ... ] } or {book|bookid} key)
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
