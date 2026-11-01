// Liest alle veröffentlichten Seiten und Beiträge über die WordPress-Schnittstelle
// und legt sie als JSON unter data/ ab. Läuft später automatisch im Build.
import { writeFile, mkdir } from "node:fs/promises";

const API = process.env.WP_API || "https://www.finkeldei-online.de/wp-json/wp/v2";
const FIELDS = "id,type,slug,link,title,content,excerpt,date,modified,parent,categories,tags,featured_media,yoast_head_json";

async function all(type) {
  const out = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/${type}?status=publish&per_page=100&page=${page}&_fields=${FIELDS}`);
    if (res.status === 400) break;               // Seite hinter dem Ende
    if (!res.ok) throw new Error(`${type} Seite ${page}: HTTP ${res.status}`);
    const batch = await res.json();
    out.push(...batch);
    if (page >= Number(res.headers.get("x-wp-totalpages") || 1)) break;
  }
  return out;
}

async function terms(type) {
  const res = await fetch(`${API}/${type}?per_page=100&_fields=id,name,slug,link,count,parent`);
  if (!res.ok) throw new Error(`${type}: HTTP ${res.status}`);
  return res.json();
}

await mkdir("data", { recursive: true });
const [pages, posts, categories] = await Promise.all([all("pages"), all("posts"), terms("categories")]);
await writeFile("data/pages.json", JSON.stringify(pages));
await writeFile("data/posts.json", JSON.stringify(posts));
await writeFile("data/categories.json", JSON.stringify(categories));
console.log(`Seiten: ${pages.length}, Beiträge: ${posts.length}, Kategorien: ${categories.length}`);
