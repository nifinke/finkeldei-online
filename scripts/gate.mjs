// Sperre vor dem Hochladen: nur wenn der Prüfbericht sauber ist, darf die Website zu All-Inkl.
import { readFileSync } from "node:fs";
const s = JSON.parse(readFileSync("pruefbericht.json", "utf8")).summary;
const problems = [];
if (s.abweichend) problems.push(`${s.abweichend} abweichende Seite(n)`);
if (s.fehlt) problems.push(`${s.fehlt} fehlende Seite(n)`);
if (s.toteLinks) problems.push(`${s.toteLinks} tote interne Link(s)`);
if (s.videosAbweichend) problems.push(`${s.videosAbweichend} abweichende(s) Video(s)`);
if (s.fragenFehlen) problems.push(`${s.fragenFehlen} fehlende FAQ-Frage(n)`);
if (problems.length) {
  console.error("Hochladen gesperrt: " + problems.join(", ") + ". Details im Prüfbericht der Vorschau.");
  process.exit(1);
}
console.log(`Prüfbericht sauber (${s.ok} identisch, ${s.geplant} geplant) – Hochladen freigegeben.`);
