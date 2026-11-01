export default {
  eleventyComputed: {
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
