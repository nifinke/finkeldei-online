// Prüft die gebaute Website gegen die heutige Live-Seite (Sitemap + Yoast-Angaben)
// und listet tote interne Links. Ergebnis: _site/pruefbericht/index.html und pruefbericht.json
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";

const OUT = "_site";
const urls = JSON.parse(readFileSync("data/sitemap-urls.json", "utf8"));
const items = [...JSON.parse(readFileSync("data/pages.json", "utf8")), ...JSON.parse(readFileSync("data/posts.json", "utf8"))];
const yoastByLink = {};
for (const i of items) if (!yoastByLink[i.link] || i.type === "page") yoastByLink[i.link] = i.yoast_head_json || {};
const decode = (s = "") => cheerio.load(`<i>${s}</i>`, null, false)("i").text();
const fileFor = (path) => join(OUT, decodeURIComponent(path), path.endsWith("/") ? "index.html" : "");
const EXPECTED_CHANGES = {
  "/apprentice-registration-page/": "entfällt, Weiterleitung auf /",
  "/blog/": "entfällt, Weiterleitung auf /meldungen/",
  "/trennung-scheidung-unterhalt-zugewinn-sorgerecht-hausrat-versorgungsausgleich/": "neu gestaltet, neuer Titel und Beschreibung",
};

const rows = [];
for (const u of urls.filter((u) => u.sitemap !== "video-sitemap.xml")) {
  const path = new URL(u.loc).pathname;
  const row = { path, status: "ok", issues: [] };
  if (EXPECTED_CHANGES[path]) row.note = EXPECTED_CHANGES[path];
  const f = fileFor(path);
  if (!existsSync(f)) {
    row.status = EXPECTED_CHANGES[path] ? "geplant" : "fehlt";
    rows.push(row); continue;
  }
  const $ = cheerio.load(readFileSync(f, "utf8"));
  const y = yoastByLink[u.loc] || {};
  const got = {
    title: $("title").text().trim(),
    description: $('meta[name="description"]').attr("content") || "",
    canonical: $('link[rel="canonical"]').attr("href") || "",
    h1: $("h1").first().text().trim(),
  };
  if (y.title && decode(y.title) !== got.title) row.issues.push(`Titel: „${got.title}“ statt „${decode(y.title)}“`);
  if ((y.description || "") !== got.description) row.issues.push(`Beschreibung abweichend`);
  if (y.canonical && y.canonical !== got.canonical) row.issues.push(`Canonical: ${got.canonical}`);
  if (!got.h1) row.issues.push("keine Überschrift H1");
  if (row.issues.length) row.status = EXPECTED_CHANGES[path] ? "geplant" : "abweichend";
  rows.push(row);
}

// Tote interne Links
const files = [];
(function walk(d) { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") && files.push(p); } })(OUT);
const dead = {};
for (const f of files) {
  if (f.startsWith(join(OUT, "pruefbericht"))) continue; // eigener Bericht aus einem früheren Lauf
  const $ = cheerio.load(readFileSync(f, "utf8"));
  $("a[href]").each((_, a) => {
    const h = $(a).attr("href");
    if (!h.startsWith("/") || h.startsWith("//") || h.includes("/wp-content/") || h.startsWith("/feed") || h.startsWith("/pruefbericht")) return;
    const path = h.split("#")[0].split("?")[0];
    if (!path || path.endsWith(".xml")) return;
    const target = join(OUT, decodeURIComponent(path), path.endsWith("/") ? "index.html" : "");
    if (!existsSync(target)) (dead[path] ||= new Set()).add(f.replace(OUT, "").replace(/index\.html$/, ""));
  });
}
const deadList = Object.entries(dead).map(([path, from]) => ({ path, from: [...from].slice(0, 5), count: from.size }));

const count = (s) => rows.filter((r) => r.status === s).length;
const summary = { geprueft: rows.length, ok: count("ok"), abweichend: count("abweichend"), fehlt: count("fehlt"), geplant: count("geplant"), toteLinks: deadList.length };
writeFileSync("pruefbericht.json", JSON.stringify({ summary, rows, dead: deadList }, null, 1));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const tr = (r) => `<tr><td><a href="${esc(r.path)}">${esc(r.path)}</a></td><td>${r.status}</td><td>${esc([r.note, ...r.issues].filter(Boolean).join(" · "))}</td></tr>`;
mkdirSync(join(OUT, "pruefbericht"), { recursive: true });
writeFileSync(join(OUT, "pruefbericht", "index.html"), `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prüfbericht</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#1f2933}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #e3e8ee;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f6f8fb}h1{font-size:24px}.k{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0 24px}.k div{background:#f6f8fb;border-radius:8px;padding:10px 14px}.k b{display:block;font-size:22px}</style></head><body>
<h1>Prüfbericht: Vorschau gegen Live-Seite</h1><p>Stand ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}. Grundlage: alle Adressen aus der heutigen Sitemap; verglichen werden Titel, Beschreibung, Canonical und Überschrift.</p>
<div class="k"><div><b>${summary.geprueft}</b>Adressen geprüft</div><div><b>${summary.ok}</b>identisch</div><div><b>${summary.abweichend}</b>abweichend</div><div><b>${summary.fehlt}</b>fehlen</div><div><b>${summary.geplant}</b>geplante Änderungen</div><div><b>${summary.toteLinks}</b>tote interne Links</div></div>
<h2>Abweichungen und geplante Änderungen</h2><table><tr><th>Adresse</th><th>Status</th><th>Hinweis</th></tr>${rows.filter((r) => r.status !== "ok").map(tr).join("")}</table>
<h2>Tote interne Links</h2><table><tr><th>Ziel</th><th>Anzahl Seiten</th><th>z. B. auf</th></tr>${deadList.map((d) => `<tr><td>${esc(d.path)}</td><td>${d.count}</td><td>${d.from.map(esc).join("<br>")}</td></tr>`).join("") || "<tr><td colspan=3>keine</td></tr>"}</table>
<h2>Alle Adressen</h2><table><tr><th>Adresse</th><th>Status</th><th>Hinweis</th></tr>${rows.map(tr).join("")}</table></body></html>`);
console.log(summary);
