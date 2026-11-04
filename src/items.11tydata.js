export default {
  eleventyComputed: {
    // Rechtsgebiet für den Kontaktblock am Seitenende (Layout C)
    endArea: (d) => {
      if (!d.item) return "";
      if (d.item.type !== "post") return d.item.path.split("/")[1];
      const slugs = d.item.categories.map((c) => c.slug);
      if (slugs.some((s) => ["owi-recht", "verkehrsrecht"].includes(s))) return "verkehrsrecht";
      if (slugs.includes("arbeitsrecht")) return "arbeitsrecht";
      if (slugs.some((s) => ["familienrecht", "unterhaltsrecht", "scheidung"].includes(s))) return "familienrecht";
      return "";
    },
    // Kategorien für die Zeile über der Überschrift eines Beitrags
    postKicker: (d) => {
      if (d.item?.type !== "post") return [];
      let cats = d.item.categories.filter((c) => c.parent !== 0);
      if (!cats.length) cats = d.item.categories.filter((c) => !["allgemein", "rechtliches"].includes(c.slug));
      return cats.slice(0, 2);
    },
    seo: (d) => d.item?.seo,
    crumbs: (d) => {
      if (!d.item) return [];
      const parts = d.item.path.split("/").filter(Boolean);
      return parts.map((_, i) => {
        const url = "/" + parts.slice(0, i + 1).join("/") + "/";
        const last = i === parts.length - 1;
        const known = d.wp.byPath[url];
        const label = last ? d.item.title : known ? known.title : parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
        return { label, url: last || !known ? null : url };
      });
    },
  },
};
