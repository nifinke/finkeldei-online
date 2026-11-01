// Bereinigt den WordPress-Inhalt für die statische Ausgabe.
import * as cheerio from "cheerio";
import { readFileSync, existsSync } from "node:fs";
import { REDIRECTS } from "./wp-const.mjs";

const HOSTS = /^https?:\/\/(www\.)?finkeldei-online\.de/i;

// ID → Adresse, um alte Links im Format ?p=123 / ?page_id=123 aufzulösen
let idMap = null;
function idToPath(id) {
  if (!idMap) {
    idMap = {};
    for (const f of ["pages.json", "posts.json"]) {
      if (!existsSync(`data/${f}`)) continue;
      for (const i of JSON.parse(readFileSync(`data/${f}`, "utf8"))) idMap[i.id] = new URL(i.link).pathname;
    }
  }
  return idMap[id];
}

export const report = { oldLinks: [] };

export function cleanContent(html) {
  const $ = cheerio.load(html, null, false);

  // Contact Form 7: kommt in Phase 3 als eigenes Formular
  $(".wpcf7").replaceWith('<div class="placeholder">Kontaktformular – wird in Phase 3 eingebaut.</div>');

  // Kostenrechner (FormCraft): wird in Phase 3 als eigener Rechner gebaut
  $("form").each((_, f) => {
    const top = $(f).closest(".formcraft-css");
    (top.length ? top : $(f)).replaceWith('<div class="formcraft-css"></div>');
  });
  $(".formcraft-css").replaceWith('<div class="placeholder">Kostenrechner – wird in Phase 3 eingebaut.</div>');

  // Videos (Videopack): schlichtes HTML5-Video in 1080p/720p, lädt erst beim Abspielen
  $(".kgvid_wrapper").each((_, w) => {
    const srcs = $(w).find("source").map((_, s) => $(s).attr("src")).get();
    const src = srcs.find((s) => /1080p/.test(s)) || srcs.find((s) => /720p/.test(s)) || srcs[0] || $(w).find("video").attr("src");
    const v = $(w).find("video");
    const poster = v.attr("poster");
    const ratio = v.attr("width") && v.attr("height") ? ` width="${v.attr("width")}" height="${v.attr("height")}"` : "";
    $(w).replaceWith(`<video controls preload="none" playsinline${ratio}${poster ? ` poster="${poster}"` : ""} src="${src}"></video>`);
  });
  $("meta").remove();

  // Google-Maps-Karte: Link statt eingebetteter Karte (kein Cookie-Banner nötig)
  $('iframe[src*="google.com/maps"]').each((_, f) => {
    $(f).replaceWith('<a class="btn btn-navy" href="https://www.google.com/maps/search/?api=1&query=Anwaltskanzlei+Finkeldei+Gladbecker+Stra%C3%9Fe+29+46236+Bottrop" target="_blank" rel="noopener">📍 Route in Google Maps öffnen</a>');
  });

  // Skripte und Stile aus Plugins im Inhalt entfernen
  $("script, style, noscript").remove();

  // Interne Links relativ machen; alte Formate (?p=, ?page_id=) auflösen
  $("a[href]").each((_, a) => {
    let href = $(a).attr("href").trim();
    if (!HOSTS.test(href) && !href.startsWith("/")) return;
    if (/\/wp-content\//.test(href)) return; // Dateien bleiben unter derselben Adresse
    const u = new URL(href, "https://finkeldei-online.de");
    const id = u.searchParams.get("p") || u.searchParams.get("page_id");
    if (id && idToPath(id)) { $(a).attr("href", idToPath(id) + (u.hash || "")); return; }
    const fixed = REDIRECTS[decodeURI(u.pathname)] || REDIRECTS[decodeURI(u.pathname).replace(/\/$/, "")];
    if (fixed) { $(a).attr("href", fixed); return; }
    if (/\.(php|html?)$/.test(u.pathname) || id) report.oldLinks.push(href);
    $(a).attr("href", href.replace(HOSTS, "") || "/");
  });

  // Bilder: nachladen, wenn sichtbar
  $("img").each((_, img) => {
    if (!$(img).attr("loading")) $(img).attr("loading", "lazy");
    if ($(img).attr("data-src")) $(img).attr("src", $(img).attr("data-src"));
    $(img).removeAttr("srcset").removeAttr("sizes").removeAttr("data-src").removeAttr("decoding");
  });

  // Leere Absätze aus dem alten Editor
  $("p").each((_, p) => { if (!$(p).text().trim() && !$(p).find("img,iframe,video,a").length) $(p).remove(); });

  return $.html();
}
