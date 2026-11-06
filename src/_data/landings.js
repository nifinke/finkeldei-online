// Thrive-Landingpages (RA Verkehrsrecht, RA Arbeitsrecht, Scheidungsanwalt) im Layout C
import { LANDINGS } from "../../scripts/wp-const.mjs";
import { readLanding } from "../../scripts/landing.mjs";

const AREA = { "/verkehrsrecht/rechtsanwalt-verkehrsrecht/": "verkehrsrecht", "/arbeitsrecht/rechtsanwalt-arbeitsrecht/": "arbeitsrecht", "/familienrecht/scheidung/scheidungsanwalt/": "familienrecht" };
const FORM = { "/verkehrsrecht/rechtsanwalt-verkehrsrecht/": "verkehrsrecht", "/arbeitsrecht/rechtsanwalt-arbeitsrecht/": "arbeitsrecht" };

export default function () {
  return LANDINGS.map((path) => {
    const live = readLanding(path) || { heroLines: [], reviews: [], tips: [], steps: [], eakte: { paras: [] }, faq: [], youtube: "" };
    if (live.eakte?.link) live.eakte.link = live.eakte.link.replace(/^https?:\/\/(www\.)?finkeldei-online\.de/, "");
    return { path, area: AREA[path], form: FORM[path] || null, ...live };
  });
}
