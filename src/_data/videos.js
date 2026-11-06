// Videos für /video-sitemap.xml und die VideoObject-Angaben.
// Quelle: Video-Sitemap von Yoast Video (data/videos.json, beim Bau abgerufen) + Videos eigener Vorlagen.
import { readFileSync, existsSync } from "node:fs";
import { LANDING_VIDEOS } from "../../scripts/wp-const.mjs";

const LANDING = "/trennung-scheidung-unterhalt-zugewinn-sorgerecht-hausrat-versorgungsausgleich/";

export default function () {
  const fromWp = existsSync("data/videos.json") ? JSON.parse(readFileSync("data/videos.json", "utf8")) : [];
  const scheidung = fromWp.find((v) => v.path === "/familienrecht/scheidung/");
  const own = [{
    path: LANDING,
    title: "Trennung und Scheidung in Bottrop – Anwaltskanzlei Finkeldei",
    description: "Trennung, Scheidung, Unterhalt, Zugewinn, Sorgerecht und Versorgungsausgleich: Rechtsanwalt Nils Finkeldei begleitet Sie – persönlich in Bottrop, telefonisch oder per Video.",
    publicationDate: scheidung?.publicationDate || "2013-12-25T19:50:51+00:00",
    contentLoc: "https://finkeldei-online.de/wp-content/uploads/2024/07/Scheidung-1080p.mp4",
    thumbnailLoc: "https://finkeldei-online.de/wp-content/uploads/2024/07/Scheidung-4k-Thumbnail.jpg",
    duration: scheidung?.duration || 574, width: 1080, height: 1352,
    tags: ["Scheidung"], familyFriendly: "yes", uploader: "RA Finkeldei", own: true,
  }];
  // Videos der Landingpages (eigene Dateien statt YouTube); Titel und Beschreibung wie bei Yoast aus den Seitenangaben
  const pages = existsSync("data/pages.json") ? JSON.parse(readFileSync("data/pages.json", "utf8")) : [];
  const dec = (s = "") => s.replace(/&#8211;/g, "–").replace(/&amp;/g, "&").replace(/&#8217;/g, "’");
  for (const [path, v] of Object.entries(LANDING_VIDEOS)) {
    const y = pages.find((p) => new URL(p.link).pathname === path)?.yoast_head_json || {};
    own.push({ path, title: dec(y.title || ""), description: dec(y.description || ""), publicationDate: v.uploadDate,
      contentLoc: v.src, thumbnailLoc: v.poster, duration: v.duration, width: v.width, height: v.height,
      tags: ["Scheidungsanwalt"], familyFriendly: "yes", uploader: "RA Finkeldei", own: true });
  }
  const list = [...fromWp, ...own.filter((o) => !fromWp.some((v) => v.path === o.path))];
  return { list, byPath: Object.fromEntries(list.map((v) => [v.path, v])) };
}
