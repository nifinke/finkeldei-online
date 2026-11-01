import wpData from "./wp.js";
import { DROPPED } from "../../scripts/wp-const.mjs";

export default function () {
  const wp = wpData();
  const indexable = (i) => (i.seo?.robots?.index || "index") !== "noindex";
  const items = Object.values(wp.byPath).filter(indexable).filter((i) => !DROPPED.has(i.path));
  const posts = items.filter((i) => i.type === "post").sort((a, b) => b.modified.localeCompare(a.modified));
  const pages = items.filter((i) => i.type === "page" && i.path !== "/meldungen/");
  return [
    { file: "sitemap_index.xml" },
    { file: "post-sitemap.xml", urls: [{ path: "/meldungen/", modified: posts[0]?.modified }, ...posts] },
    { file: "page-sitemap.xml", urls: pages },
  ];
}
