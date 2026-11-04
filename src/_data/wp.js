import { readFileSync, existsSync } from "node:fs";
import { OWN_TEMPLATE, DROPPED } from "../../scripts/wp-const.mjs";

const load = (f) => (existsSync(`data/${f}`) ? JSON.parse(readFileSync(`data/${f}`, "utf8")) : []);
const decode = (s = "") =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
   .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
   .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&nbsp;/g, " ").replace(/&hellip;/g, "…").replace(/&ndash;/g, "–").replace(/&#8211;/g, "–");

const PER_PAGE = 10;

const pathOf = (link) => decodeURI(new URL(link).pathname);

function seoOf(y = {}, fallbackTitle = "", type = "page") {
  return {
    title: decode(y.title || fallbackTitle),
    description: y.description || "",
    canonical: y.canonical || null,
    robots: y.robots || {},
    ogImage: y.og_image?.[0]?.url || null,
    ogType: y.og_type || (type === "post" ? "article" : "website"),
    schema: y.schema || null,
  };
}

export default function () {
  const categories = load("categories.json");
  const tags = load("tags.json");
  const media = Object.fromEntries(load("media.json").map((m) => [m.id, m]));
  const pages = load("pages.json");
  const posts = load("posts.json");

  const normalize = (item) => ({
    id: item.id,
    type: item.type,
    path: pathOf(item.link),
    link: item.link,
    title: decode(item.title?.rendered),
    content: item.content?.rendered || "",
    excerpt: decode((item.excerpt?.rendered || "").replace(/<[^>]+>/g, "").trim()),
    date: item.date,
    modified: item.modified,
    image: media[item.featured_media] || null,
    categories: (item.categories || []).map((id) => categories.find((c) => c.id === id)).filter(Boolean)
      .map((c) => ({ name: decode(c.name), path: pathOf(c.link), slug: c.slug, parent: c.parent })),
    tags: (item.tags || []).map((id) => tags.find((t) => t.id === id)).filter(Boolean)
      .map((t) => ({ name: decode(t.name), path: pathOf(t.link) })),
    seo: seoOf(item.yoast_head_json, item.title?.rendered, item.type),
  });

  // Seiten gehen vor: bei gleicher Adresse liefert WordPress die Seite aus
  const byPath = {};
  for (const p of pages.map(normalize)) byPath[p.path] = p;
  const shadowed = [];
  for (const p of posts.map(normalize)) {
    if (byPath[p.path]) { shadowed.push(p); continue; }
    byPath[p.path] = p;
  }
  const all = Object.values(byPath);
  const postList = all.filter((i) => i.type === "post").sort((a, b) => b.date.localeCompare(a.date));

  // Übersichtsseiten mit Seitenzählung wie in WordPress (…/page/2/)
  const archives = [];
  const paginate = (base, list, meta) => {
    const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
    for (let n = 1; n <= total; n++) {
      archives.push({
        ...meta, base, num: n, total,
        path: n === 1 ? base : `${base}page/${n}/`,
        prev: n > 1 ? (n === 2 ? base : `${base}page/${n - 1}/`) : null,
        next: n < total ? `${base}page/${n + 1}/` : null,
        posts: list.slice((n - 1) * PER_PAGE, n * PER_PAGE),
      });
    }
  };
  const home = byPath["/meldungen/"];
  paginate("/meldungen/", postList, { kind: "blog", title: "Meldungen", seo: home?.seo });
  for (const c of categories.filter((c) => c.count > 0)) {
    const base = pathOf(c.link);
    paginate(base, postList.filter((p) => p.categories.some((x) => x.path === base)),
      { kind: "category", title: decode(c.name), seo: seoOf(c.yoast_head_json, c.name) });
  }
  for (const t of tags.filter((t) => t.count > 0)) {
    const base = pathOf(t.link);
    paginate(base, postList.filter((p) => p.tags.some((x) => x.path === base)),
      { kind: "tag", title: decode(t.name), seo: seoOf(t.yoast_head_json, t.name) });
  }
  // Seitenzahlen im Titel wie bei Yoast („– Seite 2 von 31“)
  for (const a of archives) if (a.num > 1 && a.seo) a.seo = { ...a.seo, title: a.seo.title.replace(/ - /, ` - Seite ${a.num} von ${a.total} - `), canonical: null };

  return {
    home: byPath["/"] || null,
    items: all.filter((i) => !OWN_TEMPLATE.has(i.path) && !DROPPED.has(i.path)),
    posts: postList,
    archives,
    byPath,
    shadowed,
    idToPath: Object.fromEntries([...pages, ...posts].map((i) => [i.id, pathOf(i.link)])),
  };
}
