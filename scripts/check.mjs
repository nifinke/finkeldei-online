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
let autoDescriptions = 0;
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
  // Neu: fehlt bei Yoast die Beschreibung, wird sie aus dem Textanfang erzeugt (SEO-Paket A, Punkt 11)
  if (!y.description && got.description) autoDescriptions++;
  else if ((y.description || "") !== got.description) row.issues.push(`Beschreibung abweichend`);
  // Neu: kanonische Adressen auf gelöschte Elternseiten („__trashed“) zeigen auf die eigene Adresse (Punkt 9)
  if (y.canonical && y.canonical !== got.canonical && !(/__trashed/.test(y.canonical) && got.canonical === u.loc)) row.issues.push(`Canonical: ${got.canonical}`);
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

// Video-Sitemap: jeder Eintrag aus Yoast Video muss in der neuen Sitemap stehen, das Video auf der Seite eingebunden sein
const liveVideos = existsSync("data/videos.json") ? JSON.parse(readFileSync("data/videos.json", "utf8")) : [];
const vsFile = join(OUT, "video-sitemap.xml");
const built = [];
if (existsSync(vsFile)) {
  const $v = cheerio.load(readFileSync(vsFile, "utf8"), { xmlMode: true });
  $v("url").each((_, u) => built.push({
    path: new URL($v(u).children("loc").text()).pathname,
    title: $v(u).find("video\\:title").text().trim(),
    content: $v(u).find("video\\:content_loc").text().trim(),
    duration: $v(u).find("video\\:duration").text().trim(),
    thumb: $v(u).find("video\\:thumbnail_loc").text().trim(),
  }));
}
const videoRows = [];
for (const v of liveVideos) {
  const b = built.find((x) => x.path === v.path);
  const issues = [];
  if (!b) issues.push("fehlt in der Video-Sitemap");
  else {
    if (b.title !== v.title) issues.push("Titel abweichend");
    if (b.content !== v.contentLoc) issues.push("Videodatei abweichend");
    if (String(v.duration || "") !== b.duration) issues.push("Länge abweichend");
    if (b.thumb !== v.thumbnailLoc) issues.push("Vorschaubild abweichend");
  }
  videoRows.push({ path: v.path, file: v.contentLoc.split("/").pop(), status: issues.length ? "abweichend" : "ok", issues });
}
for (const b of built.filter((b) => !liveVideos.some((v) => v.path === b.path))) videoRows.push({ path: b.path, file: b.content.split("/").pop(), status: "zusätzlich", issues: [] });
for (const r of videoRows) {
  const f = fileFor(r.path);
  const html = existsSync(f) ? readFileSync(f, "utf8") : "";
  if (!/<video[\s>]/.test(html)) { r.issues.push("kein Video auf der Seite"); r.status = "abweichend"; }
  if (!html.includes('"VideoObject"')) { r.issues.push("keine VideoObject-Angabe"); r.status = "abweichend"; }
}

// Landingpages: jede Frage aus der Live-Fassung muss mit Antwort auf der neuen Seite stehen
const faqRows = [];
for (const lp of ["/verkehrsrecht/rechtsanwalt-verkehrsrecht/", "/arbeitsrecht/rechtsanwalt-arbeitsrecht/", "/familienrecht/scheidung/scheidungsanwalt/"]) {
  const liveFile = `data/live/${lp.replace(/^\/|\/$/g, "").replace(/\//g, "_")}.html`;
  if (!existsSync(liveFile) || !existsSync(fileFor(lp))) continue;
  const $l = cheerio.load(readFileSync(liveFile, "utf8"));
  const $n = cheerio.load(readFileSync(fileFor(lp), "utf8"));
  const norm = (t) => t.replace(/\s+/g, " ").trim();
  const built = $n("details.lp-q").map((_, d) => ({ q: norm($n(d).children("summary").text()), a: norm($n(d).find(".lp-a").text()) })).get();
  const live = $l(".thrv_toggle_item").map((_, it) => norm($l(it).find(".thrv_toggle_title").first().text())).get();
  const missing = live.filter((q) => !built.some((b) => b.q === q && b.a.length > 20));
  faqRows.push({ path: lp, live: live.length, built: built.length, missing });
}

const count = (s) => rows.filter((r) => r.status === s).length;
const summary = { geprueft: rows.length, ok: count("ok"), abweichend: count("abweichend"), fehlt: count("fehlt"), geplant: count("geplant"), toteLinks: deadList.length, videos: videoRows.length, videosAbweichend: videoRows.filter((r) => r.status === "abweichend").length, fragenFehlen: faqRows.reduce((n, r) => n + r.missing.length, 0), autoBeschreibungen: autoDescriptions };
writeFileSync("pruefbericht.json", JSON.stringify({ summary, rows, dead: deadList, videos: videoRows, faq: faqRows }, null, 1));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const tr = (r) => `<tr><td><a href="${esc(r.path)}">${esc(r.path)}</a></td><td>${r.status}</td><td>${esc([r.note, ...r.issues].filter(Boolean).join(" · "))}</td></tr>`;
mkdirSync(join(OUT, "pruefbericht"), { recursive: true });
writeFileSync(join(OUT, "pruefbericht", "index.html"), `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prüfbericht</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;color:#1f2933}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #e3e8ee;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f6f8fb}h1{font-size:24px}.k{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0 24px}.k div{background:#f6f8fb;border-radius:8px;padding:10px 14px}.k b{display:block;font-size:22px}</style></head><body>
<h1>Prüfbericht: Vorschau gegen Live-Seite</h1><p>Stand ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}. Grundlage: alle Adressen aus der heutigen Sitemap; verglichen werden Titel, Beschreibung, Canonical und Überschrift.</p>
<div class="k"><div><b>${summary.geprueft}</b>Adressen geprüft</div><div><b>${summary.ok}</b>identisch</div><div><b>${summary.abweichend}</b>abweichend</div><div><b>${summary.fehlt}</b>fehlen</div><div><b>${summary.geplant}</b>geplante Änderungen</div><div><b>${summary.toteLinks}</b>tote interne Links</div><div><b>${summary.autoBeschreibungen}</b>Beschreibungen neu aus dem Text erzeugt</div></div>
<h2>Abweichungen und geplante Änderungen</h2><table><tr><th>Adresse</th><th>Status</th><th>Hinweis</th></tr>${rows.filter((r) => r.status !== "ok").map(tr).join("")}</table>
<h2>Tote interne Links</h2><table><tr><th>Ziel</th><th>Anzahl Seiten</th><th>z. B. auf</th></tr>${deadList.map((d) => `<tr><td>${esc(d.path)}</td><td>${d.count}</td><td>${d.from.map(esc).join("<br>")}</td></tr>`).join("") || "<tr><td colspan=3>keine</td></tr>"}</table>
<h2>Video-Sitemap</h2><table><tr><th>Seite</th><th>Video</th><th>Status</th><th>Hinweis</th></tr>${videoRows.map((v) => `<tr><td><a href="${esc(v.path)}">${esc(v.path)}</a></td><td>${esc(v.file)}</td><td>${v.status}</td><td>${esc(v.issues.join(" · "))}</td></tr>`).join("") || "<tr><td colspan=4>keine Videos</td></tr>"}</table>
<h2>Häufige Fragen der Landingpages</h2><table><tr><th>Seite</th><th>Fragen live</th><th>Fragen neu</th><th>fehlend oder ohne Antwort</th></tr>${faqRows.map((f) => `<tr><td><a href="${esc(f.path)}">${esc(f.path)}</a></td><td>${f.live}</td><td>${f.built}</td><td>${esc(f.missing.join(" · ") || "keine")}</td></tr>`).join("")}</table>
<h2>Alle Adressen</h2><table><tr><th>Adresse</th><th>Status</th><th>Hinweis</th></tr>${rows.map(tr).join("")}</table></body></html>`);
console.log(summary);
