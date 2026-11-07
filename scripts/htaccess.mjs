// Erzeugt _site/.htaccess für den Ordner /website/ bei All-Inkl.
// Die Haupt-.htaccess leitet Seitenaufrufe intern hierher; diese Datei entscheidet:
// alte Adressen → 301, gelöschte → 410, Kurzlinks ?p= → 301, vorhandene Seite → ausliefern, sonst 404.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { REDIRECTS, GONE } from "./wp-const.mjs";
import { LEGACY_REDIRECTS } from "./legacy-redirects.mjs";

const OUT = "_site";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const built = (p) => existsSync(join(OUT, decodeURI(p), p.endsWith("/") ? "index.html" : ""));

// Alle Weiterleitungen zusammenführen; die genauere (längere) Adresse zuerst, damit keine Ketten entstehen
const map = new Map();
for (const [from, to] of LEGACY_REDIRECTS) map.set(from, to);
for (const [from, to] of Object.entries(REDIRECTS)) map.set(from, to);
const seen = new Set();
const redirects = [...map.entries()]
  .map(([from, to]) => ({ from, to, base: from.replace(/\/$/, ""), file: /\.[a-z0-9]{2,4}$/i.test(from) }))
  .filter((r) => (seen.has(r.base) ? false : (seen.add(r.base), true)))
  .sort((a, b) => b.base.length - a.base.length);

const warnings = [];
for (const r of redirects) if (!r.file && built(r.base + "/")) warnings.push(`Weiterleitung überdeckt eine vorhandene Seite: ${r.from}`);

const lines = [];
lines.push(readFileSync("src/website.htaccess", "utf8").trim(), "");
lines.push("# ---- Ab hier erzeugt von scripts/htaccess.mjs ----", "DirectorySlash Off", "ErrorDocument 404 /website/404.html", "ErrorDocument 410 /website/404.html", "");
lines.push("<IfModule mod_rewrite.c>", "RewriteEngine On", "");
lines.push("# Sitemap-Adressen von WordPress/Yoast", "RewriteRule ^(wp-)?sitemap\\.xml$ /sitemap_index.xml [R=301,L]", "");
lines.push(`# Alte Adressen (${redirects.length})`);
for (const r of redirects) {
  const p = esc(r.base.slice(1));
  const target = r.to.replace(/#/g, "\\#");
  if (r.file) lines.push(`RewriteRule ^${p}$ ${target} [R=301,L,NE]`);
  else lines.push(`RewriteRule ^${p}(?:/(.*))?$ ${target}${r.to.endsWith("/") && !r.to.includes("#") ? "$1" : ""} [R=301,L,NE]`);
}
lines.push("", `# Gelöschte Beiträge (${GONE.length})`);
for (const g of GONE) lines.push(`RewriteRule ^${esc(g.replace(/^\/|\/$/g, ""))}/?$ - [G,L]`);

// Kurzlinks ?p=123 und ?page_id=45 wie bei WordPress
const items = [];
for (const f of ["pages", "posts"]) if (existsSync(`data/${f}.json`)) items.push(...JSON.parse(readFileSync(`data/${f}.json`, "utf8")));
const byId = new Map();
for (const i of items) { const path = new URL(i.link).pathname; if (built(path)) byId.set(i.id, path); }
lines.push("", `# Kurzlinks ?p= / ?page_id= (${byId.size})`);
for (const [id, path] of [...byId.entries()].sort((a, b) => a[0] - b[0])) {
  lines.push(`RewriteCond %{QUERY_STRING} (^|&)(p|page_id)=${id}(&|$)`, `RewriteRule ^$ ${path}? [R=301,L]`);
}

lines.push("", "# Ordner ohne Schrägstrich → mit Schrägstrich (ohne /website/ in der Adresse)",
  "RewriteCond %{REQUEST_FILENAME} -d",
  "RewriteCond %{REQUEST_FILENAME}/index.html -f [OR]",
  "RewriteCond %{REQUEST_FILENAME}/index.xml -f",
  "RewriteRule ^(.+[^/])$ /$1/ [R=301,L]",
  "", "# Vorhandene Datei oder Seite ausliefern",
  "RewriteCond %{REQUEST_FILENAME} -f [OR]",
  "RewriteCond %{REQUEST_FILENAME}/index.html -f [OR]",
  "RewriteCond %{REQUEST_FILENAME}/index.xml -f",
  "RewriteRule ^ - [L]",
  "", "# Alles andere: nicht gefunden (eigene 404-Seite)",
  "RewriteRule ^ - [R=404,L]",
  "</IfModule>", "");
lines.push("# Suchindex (Dateinamen ohne Prüfsumme): nur einen Tag zwischenspeichern",
  "<IfModule mod_headers.c>",
  '<FilesMatch "^(pagefind[^/]*|wasm\\..*|.*\\.pf_[a-z]+)$">',
  'Header set Cache-Control "public, max-age=86400"',
  "</FilesMatch>",
  "</IfModule>", "");

writeFileSync(join(OUT, ".htaccess"), lines.join("\n"));
console.log(`.htaccess für /website/: ${redirects.length} Weiterleitungen, ${GONE.length} gelöscht, ${byId.size} Kurzlinks`);
for (const w of warnings) console.warn("WARNUNG: " + w);
if (warnings.length) process.exit(1);
