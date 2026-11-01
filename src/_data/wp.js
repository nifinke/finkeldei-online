import { readFileSync, existsSync } from "node:fs";

const load = (f) => (existsSync(`data/${f}`) ? JSON.parse(readFileSync(`data/${f}`, "utf8")) : []);
const decode = (s = "") =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
   .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
   .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&nbsp;/g, " ").replace(/&hellip;/g, "…").replace(/&ndash;/g, "–");

// Sonderseiten mit eigener Vorlage (Startseite) oder Neubau in späteren Phasen
const OWN_TEMPLATE = new Set(["/"]);

function normalize(item, categories) {
  const path = new URL(item.link).pathname;
  const y = item.yoast_head_json || {};
  return {
    id: item.id,
    type: item.type,                      // "page" | "post"
    path,
    title: decode(item.title?.rendered),
    content: item.content?.rendered || "",
    date: item.date,
    modified: item.modified,
    categories: (item.categories || []).map((id) => categories.find((c) => c.id === id)).filter(Boolean),
    seo: {
      title: decode(y.title || item.title?.rendered),
      description: y.description || y.og_description || "",
      canonical: y.canonical || null,
      robots: y.robots || {},
      ogImage: y.og_image?.[0]?.url || null,
      ogType: y.og_type || (item.type === "post" ? "article" : "website"),
      schema: y.schema || null,
    },
  };
}

export default function () {
  const categories = load("categories.json");
  const all = [...load("pages.json"), ...load("posts.json")].map((i) => normalize(i, categories));
  const byPath = Object.fromEntries(all.map((i) => [i.path, i]));
  return {
    home: byPath["/"] || null,
    items: all.filter((i) => !OWN_TEMPLATE.has(i.path)),
    byPath,
    categories,
  };
}
