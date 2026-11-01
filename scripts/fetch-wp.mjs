// Liest alle veröffentlichten Inhalte über die WordPress-Schnittstelle und legt sie unter data/ ab.
// Läuft automatisch im GitHub-Workflow vor jedem Bau.
import { writeFile, mkdir } from "node:fs/promises";

const SITE = process.env.WP_SITE || "https://finkeldei-online.de";
const API = `${SITE}/wp-json/wp/v2`;
const HEADERS = { "User-Agent": "finkeldei-online-build (GitHub Actions)", Accept: "application/json" };
const FIELDS = "id,type,slug,link,status,title,content,excerpt,date,modified,parent,menu_order,categories,tags,featured_media,template,yoast_head_json";

async function get(url, asText = false) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return { body: asText ? await res.text() : await res.json(), headers: res.headers };
    if (res.status === 400) return null; // Seite hinter dem Ende
    if (attempt === 3) throw new Error(`${url}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

async function all(type, fields) {
  const out = [];
  for (let page = 1; ; page++) {
    const r = await get(`${API}/${type}?per_page=100&page=${page}&_fields=${fields}`);
    if (!r) break;
    out.push(...r.body);
    if (page >= Number(r.headers.get("x-wp-totalpages") || 1)) break;
  }
  return out;
}

await mkdir("data/live", { recursive: true });
const [pages, posts, categories, tags, media] = await Promise.all([
  all("pages", FIELDS),
  all("posts", FIELDS),
  all("categories", "id,name,slug,link,count,parent,description,yoast_head_json"),
  all("tags", "id,name,slug,link,count,description,yoast_head_json"),
  all("media", "id,source_url,alt_text,media_details,mime_type"),
]);
const slim = media.map((m) => ({ id: m.id, url: m.source_url, alt: m.alt_text, mime: m.mime_type, w: m.media_details?.width, h: m.media_details?.height }));
await writeFile("data/pages.json", JSON.stringify(pages));
await writeFile("data/posts.json", JSON.stringify(posts));
await writeFile("data/categories.json", JSON.stringify(categories));
await writeFile("data/tags.json", JSON.stringify(tags));
await writeFile("data/media.json", JSON.stringify(slim));

// Alle Adressen aus den Yoast-Sitemaps: Grundlage für die Prüfung
const index = (await get(`${SITE}/sitemap_index.xml`, true)).body;
const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const urls = [];
for (const m of maps) {
  const xml = (await get(m, true)).body;
  for (const u of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)) urls.push({ sitemap: m.split("/").pop(), loc: u[1], lastmod: u[2] || null });
}
await writeFile("data/sitemap-urls.json", JSON.stringify(urls, null, 1));

// Seiten mit Thrive-Layout: gerenderte Fassung als Vorlage für den Nachbau
for (const path of ["/", "/rechtsanwalt/", "/kanzlei/", "/bewerten/", "/trennung-scheidung-unterhalt-zugewinn-sorgerecht-hausrat-versorgungsausgleich/"]) {
  const r = await get(SITE + path, true);
  if (r) await writeFile(`data/live/${path.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "startseite"}.html`, r.body);
}

console.log(`Seiten ${pages.length}, Beiträge ${posts.length}, Kategorien ${categories.length}, Schlagwörter ${tags.length}, Medien ${slim.length}, Sitemap-Adressen ${urls.length}`);
