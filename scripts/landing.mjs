// Liest die Thrive-Landingpages aus der beim Bau abgeholten Live-Fassung (data/live/*.html).
// Die WordPress-Schnittstelle liefert bei Thrive-Seiten nicht alle Inhalte (z. B. die Antworten der „Häufigen Fragen“).
import * as cheerio from "cheerio";
import { readFileSync, existsSync } from "node:fs";
import { cleanContent } from "./clean-content.mjs";
import { calculatorHtml } from "./calculator.mjs";

const ALLOWED = new Set(["p", "ul", "ol", "li", "a", "strong", "b", "em", "i", "br", "h3", "h4"]);

// Thrive-Markup auf schlichtes HTML reduzieren (Absätze, Listen, Links, Hervorhebungen)
function simplify(html) {
  const $ = cheerio.load(cleanContent(html), null, false);
  $("img, svg, figure, iframe, video, button, form, input, select, textarea").remove();
  let changed = true;
  while (changed) {
    changed = false;
    $("*").each((_, el) => {
      if (!ALLOWED.has(el.tagName)) { $(el).replaceWith($(el).contents()); changed = true; return false; }
      const href = el.tagName === "a" ? $(el).attr("href") : null;
      for (const a of Object.keys(el.attribs || {})) $(el).removeAttr(a);
      if (href) $(el).attr("href", href);
    });
  }
  $("p").each((_, p) => { if (!$(p).text().trim()) $(p).remove(); });
  let out = $.html().trim();
  if (out && !/^<(p|ul|ol|h3|h4)/.test(out)) out = `<p>${out}</p>`; // loser Text ohne Absatz
  return out;
}
const text = ($, el) => { const c = $(el).clone(); c.find("br").replaceWith(" "); return c.text().replace(/\s+/g, " ").trim(); };
const textBr = ($, el) => { const c = $(el).clone(); c.find("br").replaceWith("\n"); c.find("p").each((_, p) => { $(p).append("\n"); }); return c.text().split("\n").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean); };

export function readLanding(path) {
  const file = `data/live/${path.replace(/^\/|\/$/g, "").replace(/\//g, "_")}.html`;
  if (!existsSync(file)) return null;
  const $ = cheerio.load(readFileSync(file, "utf8"));
  $("script, style, noscript").remove();
  const section = (start) => $("h2").filter((_, h) => text($, h).startsWith(start)).first().closest(".thrv-page-section");

  // Kopf: Schlagzeile und Erfahrungszeile
  const hero = $(".thrv-page-section").first();
  const heroH2 = hero.find("h2").map((_, h) => textBr($, h).join(" ")).get();

  // Bewertungen: Name (h5), Text, Portal (Bild davor)
  const reviews = [];
  section("Was Mandanten sagen").find("h5").each((_, h) => {
    let box = $(h).parent();
    while (box.parent().length && box.parent().find("h5").length === 1) box = box.parent();
    const src = (box.find("img").map((_, i) => $(i).attr("data-src") || $(i).attr("src") || "").get().join(" "));
    const lines = box.find("p").map((_, p) => textBr($, p)).get().flat().filter((l) => l !== text($, h));
    reviews.push({ name: text($, h), lines, portal: /anwalt_de/.test(src) ? "anwalt.de" : /google/.test(src) ? "Google" : "" });
  });

  // Tipps (Inhaltskästen mit Titel und Text) oder Schritte („So einfach geht's“)
  const tips = [];
  const tipSec = section("Wichtige Tipps");
  tipSec.find(".thrv_contentbox_shortcode").each((_, box) => {
    const t = $(box).find(".tcb-plain-text").first();
    const body = $(box).find("p").map((_, p) => `<p>${text($, p)}</p>`).get().join("");
    if (t.length && body) tips.push({ title: text($, t), html: body });
  });
  const steps = [];
  const stepSec = section("So einfach geht");
  if (stepSec.length) {
    const parts = textBr($, stepSec).slice(1).join("\n").split(/\n(?=0\d\n)/);
    for (const part of parts) {
      const m = part.match(/^(0\d)\n([\s\S]+)$/);
      if (m) steps.push({ num: m[1], lines: m[2].split("\n") });
    }
  }

  // Elektronische Akte
  const ak = section("Elektronische Akte");
  const eakte = { title: ak.length ? text($, ak.find("h2").first()) : "", paras: ak.find("p").map((_, p) => text($, p)).get().filter(Boolean),
    link: ak.find("a.tcb-button-link").attr("href") || "", linkText: text($, ak.find("a.tcb-button-link").first()) };

  // Häufige Fragen (Antwort mit Kostenrechner, wo FormCraft eingebunden ist)
  const faq = [];
  $(".thrv_toggle_item").each((_, it) => {
    const q = text($, $(it).find(".thrv_toggle_title").first());
    const a = $(it).find(".tve_faqC").first();
    const hasCalc = a.find("form.fc-form-4").length > 0;
    a.find(".formcraft-css, form").remove();
    const html = simplify(a.html() || "");
    if (q) faq.push({ q, html, calc: hasCalc ? calculatorHtml() : "", plain: cheerio.load(html).text().replace(/\s+/g, " ").trim() });
  });

  // Video (YouTube) – nur als Link, ohne Einbettung
  const yt = $("[data-url*='youtu']").first().attr("data-url") || "";

  return { heroLines: heroH2, reviews, tips, steps, eakte, faq, youtube: yt };
}
