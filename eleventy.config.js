import { cleanContent } from "./scripts/clean-content.mjs";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addFilter("clean", (html) => cleanContent(html || ""));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("dateDE", (iso) =>
    new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }));
  eleventyConfig.addFilter("isoDate", (iso) => new Date(iso).toISOString().slice(0, 10));
  eleventyConfig.addFilter("isoDateTime", (iso) => new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toISOString().replace(".000Z", "+00:00"));
  eleventyConfig.addFilter("rfc822", (iso) => new Date(iso).toUTCString());
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("urlencodePath", (p) => p.split("/").map((s) => encodeURIComponent(s).toLowerCase().replace(/%[0-9a-f]{2}/g, (m) => m)).join("/"));
  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
