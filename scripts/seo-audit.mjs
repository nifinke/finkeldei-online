// SEO-Prüfung der fertig gebauten Website (_site, Produktionsbau ohne PREVIEW).
// Vergleicht jede Seite mit den Yoast-Angaben aus WordPress und prüft Links, Bilder, Sitemaps und strukturierte Daten.
import * as cheerio from "cheerio";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://finkeldei-online.de";
const OUT = "_site";
const load = (f) => JSON.parse(readFileSync(f, "utf8"));
const dec = (s) => cheerio.load(`<i>${s ?? ""}</i>`)("i").text().trim();

// Yoast-Angaben je Pfad
const yoast = {};
for (const f of ["pages", "posts", "categories", "tags"]) for (const i of load(`data/${f}.json`)) {
  if (!i.link || !i.yoast_head_json) continue;
  yoast[new URL(i.link).pathname] = { ...i.yoast_head_json, _type: f };
}

// alle HTML-Dateien
const files = [];
(function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (!/pagefind|assets/.test(n)) walk(p); } else if (n.endsWith(".html")) files.push(p); } })(OUT);
const pathOf = (f) => "/" + f.slice(OUT.length + 1).replace(/index\.html$/, "");
const built = new Set(files.map(pathOf));

// Weiterleitungen (für Linkprüfung)
import { REDIRECTS, GONE } from "./wp-const.mjs";
const redirects = new Map(Object.entries(REDIRECTS));
for (const g of GONE) redirects.set(g, "410");

const issues = {}; const add = (k, p, d = "") => (issues[k] ||= []).push(d ? `${p} → ${d}` : p);
const titles = new Map(), descs = new Map();
const pageInfo = {};
let pagesChecked = 0;

for (const f of files) {
  const path = pathOf(f);
  if (path.startsWith("/pruefbericht")) continue;
  const html = readFileSync(f, "utf8");
  const $ = cheerio.load(html);
  const meta = (sel) => $(sel).attr("content");
  const robots = meta('meta[name="robots"]') || "";
  const noindex = /noindex/.test(robots);
  const isRedirectStub = /http-equiv="refresh"/i.test(html);
  if (isRedirectStub) continue;
  pagesChecked++;
  const title = $("title").text().trim();
  const desc = meta('meta[name="description"]') || "";
  const canon = $('link[rel="canonical"]').attr("href") || "";
  pageInfo[path] = { noindex, canon };

  if ($("html").attr("lang") !== "de") add("lang fehlt/falsch", path);
  if (!title) add("Titel fehlt", path);
  if (!noindex) {
    if (!desc) add("Beschreibung fehlt", path);
    (titles.get(title) || titles.set(title, []).get(title)).push(path);
    if (desc) (descs.get(desc) || descs.set(desc, []).get(desc)).push(path);
  }
  if (!canon) add("Canonical fehlt", path);
  else if (!noindex && canon !== SITE + path) add("Canonical zeigt woanders hin", path, canon);
  const h1 = $("h1").length;
  if (h1 !== 1 && !noindex) add(`H1-Anzahl ≠ 1`, path, String(h1));
  if (!meta('meta[name="viewport"]')) add("viewport fehlt", path);

  // Vergleich mit Yoast
  const y = yoast[path];
  if (y) {
    const yRobots = Object.values(y.robots || {}).join(", ");
    if (yRobots && robots !== yRobots) add("robots weicht von Yoast ab", path, `${robots} | Yoast: ${yRobots}`);
    if (dec(y.title) !== title) add("Titel weicht von Yoast ab", path, `${title} | Yoast: ${dec(y.title)}`);
    if (y.description && dec(y.description) !== desc) add("Beschreibung weicht von Yoast ab", path);
    if (y.canonical && y.canonical !== canon) add("Canonical weicht von Yoast ab", path, `${canon} | Yoast: ${y.canonical}`);
    if (y.og_title && dec(y.og_title) !== meta('meta[property="og:title"]')) add("og:title weicht von Yoast ab", path, `${meta('meta[property="og:title"]')} | Yoast: ${dec(y.og_title)}`);
    if (y.og_site_name && dec(y.og_site_name) !== meta('meta[property="og:site_name"]')) add("og:site_name weicht ab", path, `${meta('meta[property="og:site_name"]')} | Yoast: ${dec(y.og_site_name)}`);
    if (y.og_image?.[0]?.url && y.og_image[0].url !== meta('meta[property="og:image"]')) add("og:image weicht ab", path);
    if (y.og_image?.[0]?.width && !meta('meta[property="og:image:width"]')) add("og:image:width/height/type fehlen", path);
    if (y.article_published_time && !meta('meta[property="article:published_time"]')) add("article:published_time fehlt", path);
    if (y.article_modified_time && !meta('meta[property="article:modified_time"]')) add("article:modified_time fehlt", path);
    if (y.article_publisher && !meta('meta[property="article:publisher"]')) add("article:publisher fehlt", path);
    if (y.twitter_card && !meta('meta[name="twitter:card"]')) add("twitter:card/site fehlen", path);
    if (y.author && !meta('meta[name="author"]')) add("author-Meta fehlt", path);
  } else if (!noindex && !/^\/(page\/|meldungen\/page|suche)/.test(path)) add("keine Yoast-Daten zum Abgleich", path);

  // strukturierte Daten
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      const j = JSON.parse($(s).html());
      const types = []; const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") { if (o["@type"]) types.push([].concat(o["@type"]).join("/")); Object.values(o).forEach(walk); } };
      walk(j); (pageInfo[path].schema ||= []).push(...types);
    } catch (e) { add("JSON-LD ungültig", path, e.message); }
  });

  // Bilder
  $("main img").each((_, img) => {
    const src = $(img).attr("src") || "";
    if ($(img).attr("alt") === undefined) add("Bild ohne alt-Attribut", path, src);
    if (!$(img).attr("width") || !$(img).attr("height")) add("Bild ohne width/height", path, src);
  });
  const imgs = $("main img").toArray();
  imgs.slice(1).forEach((img) => { if ($(img).attr("loading") !== "lazy") add("Bild (nicht erstes) ohne loading=lazy", path, $(img).attr("src")); });

  // Links
  $("a[href]").each((_, a) => {
    let href = $(a).attr("href");
    if (/^(mailto|tel|#|javascript)/.test(href)) return;
    if (/^http:\/\/(www\.)?finkeldei-online\.de/.test(href)) add("http-Link auf eigene Domain", path, href);
    let u; try { u = new URL(href, SITE + path); } catch { add("Link ungültig", path, href); return; }
    if (!/^(www\.)?finkeldei-online\.de$/.test(u.hostname)) return;
    const p = decodeURI(u.pathname);
    if (/^\/(wp-content|wp-json|feed)/.test(p) || /\.\w{2,4}$/.test(p)) return;
    if (u.hostname.startsWith("www.")) add("Link mit www", path, href);
    if (built.has(p)) return;
    if (built.has(p + "/")) { add("interner Link ohne Schrägstrich am Ende", path, href); return; }
    if (redirects.has(p)) { add(redirects.get(p) === "410" ? "Link auf gelöschte Seite (410)" : "Link auf weitergeleitete Adresse", path, `${p} → ${redirects.get(p)}`); return; }
    add("Link ins Leere", path, href);
  });
}

// doppelte Titel/Beschreibungen
for (const [t, ps] of titles) if (ps.length > 1) add("doppelter Titel", ps.join(", "), t);
for (const [d, ps] of descs) if (ps.length > 1) add("doppelte Beschreibung", ps.join(", "), d.slice(0, 80));

// Sitemaps
const smUrls = new Map();
for (const f of readdirSync(OUT).filter((n) => /sitemap\.xml$/.test(n) && n !== "sitemap_index.xml")) {
  const $ = cheerio.load(readFileSync(`${OUT}/${f}`, "utf8"), { xmlMode: true });
  $("url").each((_, u) => smUrls.set($(u).find("loc").first().text(), { f, lastmod: $(u).find("lastmod").text(), images: $(u).find("image\\:image").length }));
}
for (const [loc, info] of smUrls) {
  const p = new URL(loc).pathname;
  if (!built.has(p)) add("Sitemap-Adresse nicht gebaut", loc);
  else if (pageInfo[p]?.noindex) add("noindex-Seite in Sitemap", loc);
  if (!info.lastmod && info.f !== "video-sitemap.xml") add("Sitemap ohne lastmod", loc);
}
for (const [p, i] of Object.entries(pageInfo)) if (!i.noindex && !smUrls.has(SITE + p)) add("indexierbar, aber nicht in Sitemap", p);
const liveSm = load("data/sitemap-urls.json");
for (const u of liveSm) if (!smUrls.has(u.loc)) add("in Live-Sitemap, fehlt in neuer Sitemap", u.loc);

// Website-weite Dinge
const home = cheerio.load(readFileSync(`${OUT}/index.html`, "utf8"));
const site = {
  favicon: home('link[rel*="icon"]').length > 0,
  appleTouchIcon: home('link[rel="apple-touch-icon"]').length > 0,
  feedLink: home('link[type="application/rss+xml"]').length > 0,
  feedFile: existsSync(`${OUT}/feed/index.xml`) || existsSync(`${OUT}/feed.xml`) || existsSync(`${OUT}/feed/index.html`),
  notFoundPage: existsSync(`${OUT}/404.html`),
  googleVerification: home('meta[name="google-site-verification"]').length > 0,
  robotsTxt: existsSync(`${OUT}/robots.txt`) ? readFileSync(`${OUT}/robots.txt`, "utf8").trim() : null,
  sitemapUrls: smUrls.size,
  pagesChecked,
};
const schemaTypes = {};
for (const i of Object.values(pageInfo)) for (const t of new Set(i.schema || [])) schemaTypes[t] = (schemaTypes[t] || 0) + 1;

console.log(JSON.stringify({ site, schemaTypes, counts: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])) }, null, 1));
for (const [k, v] of Object.entries(issues)) { console.log(`\n## ${k} (${v.length})`); v.slice(0, 8).forEach((x) => console.log("  " + x)); }
