// Bereinigt den WordPress-Inhalt für die statische Ausgabe.
import * as cheerio from "cheerio";

const HOSTS = /^https?:\/\/(www\.)?finkeldei-online\.de/i;

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

  // Videos (Videopack): schlichtes HTML5-Video, lädt erst beim Abspielen
  $(".kgvid_wrapper").each((_, w) => {
    const src = $(w).find("source").first().attr("src") || $(w).find("video").attr("src");
    const poster = $(w).find("video").attr("poster");
    $(w).replaceWith(`<video controls preload="none"${poster ? ` poster="${poster}"` : ""} src="${src}"></video>`);
  });
  $("meta").remove();


  // Skripte und Stile aus Plugins im Inhalt entfernen
  $("script, style, noscript").remove();

  // Interne Links relativ machen (Dateien in /wp-content/ bleiben absolut)
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (HOSTS.test(href) && !/\/wp-content\//.test(href)) {
      $(a).attr("href", href.replace(HOSTS, "") || "/");
    }
  });

  // Bilder: nachladen, wenn sichtbar
  $("img").each((_, img) => {
    if (!$(img).attr("loading")) $(img).attr("loading", "lazy");
    if ($(img).attr("data-src")) $(img).attr("src", $(img).attr("data-src"));
    $(img).removeAttr("srcset").removeAttr("sizes").removeAttr("data-src");
  });

  // Leere Absätze aus dem alten Editor
  $("p").each((_, p) => { if (!$(p).text().trim() && !$(p).find("img,iframe,video").length) $(p).remove(); });

  return $.html();
}
