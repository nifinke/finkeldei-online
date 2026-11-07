// PREVIEW=1 → Prototyp: Hinweisleiste, noindex
// version: Prüfsumme über Stylesheet, Skripte und Bilder – ändert sich nur, wenn sich eine dieser Dateien ändert.
// So bleiben unveränderte Seiten beim nächsten Bau Byte für Byte gleich und müssen nicht neu hochgeladen werden.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function assetHash(dir = "src/assets") {
  const h = createHash("sha256");
  const walk = (d) => readdirSync(d).sort().forEach((n) => {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p); else h.update(p).update(readFileSync(p));
  });
  walk(dir);
  return h.digest("hex").slice(0, 10);
}

export default {
  preview: !!process.env.PREVIEW,
  noindex: !!process.env.PREVIEW || !!process.env.NOINDEX,
  version: assetHash(),
};
