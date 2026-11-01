// Erzeugt die Weiterleitungsregeln für den Webserver (aktiv erst beim Umschalten in Phase 4)
import { writeFileSync } from "node:fs";
import { REDIRECTS, GONE } from "./wp-const.mjs";
const lines = ["# Weiterleitungen – erzeugt aus scripts/wp-const.mjs", "RewriteEngine On"];
for (const [from, to] of Object.entries(REDIRECTS)) {
  const re = "^" + from.slice(1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\/$/, "") + "/?$";
  lines.push(`RewriteRule ${re} ${to.replace("#", "\\#")} [R=301,L,NE]`);
}
for (const path of GONE) lines.push(`RewriteRule ^${path.slice(1).replace(/\/$/, "")}/?$ - [G,L]`);
writeFileSync("_site/redirects.htaccess.txt", lines.join("\n") + "\n");
console.log(`${Object.keys(REDIRECTS).length} Weiterleitungen und ${GONE.length} gelöschte Adressen vorbereitet`);
