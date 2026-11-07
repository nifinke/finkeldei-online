import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanContent } from "./scripts/clean-content.mjs";
import * as cheerio from "cheerio";
import { formHtml } from "./scripts/forms.mjs";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  // Seitensymbol auch unter /favicon.ico (Browser fragen diese Adresse direkt ab)
  if (existsSync("data/media/favicon.png")) eleventyConfig.addPassthroughCopy({ "data/media/favicon.png": "favicon.ico" });
  eleventyConfig.addFilter("clean", (html) => cleanContent(html || ""));
  // Layout C: Fotokästen aus dem WordPress-Text ausblenden (Foto steht schon im Seitenkopf)
  eleventyConfig.addFilter("dropPhotoBox", (html) => {
    if (!html || !/Rechtsanwalt_freigestellt_420|GesichtLomoKl/.test(html)) return html;
    const $ = cheerio.load(html, null, false);
    $('img[src*="Rechtsanwalt_freigestellt_420"], img[src*="GesichtLomoKl"]').each((_, img) => {
      const box = $(img).closest('div[style*="float"]');
      (box.length ? box : $(img)).remove();
    });
    return $.html();
  });
  eleventyConfig.addFilter("faqSchema", (faq) => (faq || []).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.plain } })));
  eleventyConfig.addShortcode("fxform", (kind) => formHtml(kind));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("dateDE", (iso) =>
    new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }));
  eleventyConfig.addFilter("isoDate", (iso) => new Date(iso).toISOString().slice(0, 10));
  eleventyConfig.addFilter("isoDateTime", (iso) => new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toISOString().replace(".000Z", "+00:00"));
  eleventyConfig.addFilter("rfc822", (iso) => new Date(iso).toUTCString());
  eleventyConfig.addFilter("schemaHours", (list) => (list || []).map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days.map((d) => "https://schema.org/" + d),
    opens: h.opens, closes: h.closes,
  })));
  eleventyConfig.addFilter("isoDuration", (sec) => {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return "PT" + (h ? h + "H" : "") + (m ? m + "M" : "") + (s || (!h && !m) ? s + "S" : "");
  });
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("urlencodePath", (p) => p.split("/").map((s) => encodeURIComponent(s).toLowerCase().replace(/%[0-9a-f]{2}/g, (m) => m)).join("/"));
  // Bilder in die Sitemaps eintragen (wie Yoast): Beitragsbild und Bilder im Text jeder Seite
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const out = dir.output;
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    for (const f of ["page-sitemap.xml", "post-sitemap.xml"]) {
      const file = join(out, f);
      if (!existsSync(file)) continue;
      let xml = readFileSync(file, "utf8");
      let total = 0;
      xml = xml.replace(/<url><loc>([^<]+)<\/loc>/g, (m, loc) => {
        const html = join(out, decodeURIComponent(new URL(loc).pathname), "index.html");
        if (!existsSync(html)) return m;
        const $ = cheerio.load(readFileSync(html, "utf8"));
        const imgs = new Set();
        const og = $('meta[property="og:image"]').attr("content");
        if (og && /\/wp-content\/uploads\//.test(og)) imgs.add(og);
        $("main img").each((_, i) => {
          const src = $(i).attr("src") || "";
          if (/\/wp-content\/uploads\/.+\.(jpe?g|png|gif|webp|avif)$/i.test(src)) imgs.add(new URL(src, loc).href);
        });
        total += imgs.size;
        return m + [...imgs].slice(0, 1000).map((u) => `<image:image><image:loc>${esc(u)}</image:loc></image:image>`).join("");
      });
      xml = xml.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
      writeFileSync(file, xml);
      console.log(`${f}: ${total} Bilder eingetragen`);
    }
  });
  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
