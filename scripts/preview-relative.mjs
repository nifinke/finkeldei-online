// Nur für die Vorschau als private Claude-Seite: wandelt absolute Links in relative um.
// Links auf Seiten, die im Prototyp noch fehlen, zeigen auf die Live-Website.
import { readdir, readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { join, relative, dirname, posix } from "node:path";
import { existsSync } from "node:fs";

const SRC = "_site", OUT = "_preview", LIVE = "https://finkeldei-online.de";
await rm(OUT, { recursive: true, force: true });
await cp(SRC, OUT, { recursive: true });

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

for await (const file of walk(OUT)) {
  if (!file.endsWith(".html")) continue;
  // Fehlerseite: GitHub Pages zeigt sie unter beliebiger Adresse → feste Basis statt relativer Links
  if (relative(OUT, file) === "404.html") {
    const base = process.env.PREVIEW_BASE || "/finkeldei-online/";
    let html = await readFile(file, "utf8");
    html = html.replace(/(href|src|action)="\/(?!\/)([^"]*)"/g, (m, attr, url) => `${attr}="${base}${url}"`);
    await writeFile(file, html);
    continue;
  }
  const from = posix.dirname(relative(OUT, file).split("\\").join("/"));
  let html = await readFile(file, "utf8");
  html = html.replace(/(href|src)="(\/[^"]*)"/g, (m, attr, url) => {
    const [beforeHash, hash = ""] = url.split("#");
    const [path, query = ""] = beforeHash.split("?");
    let target = path.endsWith("/") ? path + "index.html" : path;
    if (!existsSync(join(OUT, target))) return `${attr}="${LIVE}${url}"${attr === "href" ? ' target="_top"' : ""}`;
    let rel = posix.relative(from, target.slice(1)) || "index.html";
    return `${attr}="${rel}${query ? "?" + query : ""}${hash ? "#" + hash : ""}"`;
  });
  await writeFile(file, html);
}
console.log("Vorschau erzeugt in", OUT);
