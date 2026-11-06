export default {
  eleventyComputed: {
    item: (d) => d.wp.byPath[d.landing.path],
    seo: (d) => d.wp.byPath[d.landing.path]?.seo,
    endArea: (d) => d.landing.area,
    crumbs: (d) => {
      const parts = d.landing.path.split("/").filter(Boolean);
      return parts.map((_, i) => {
        const url = "/" + parts.slice(0, i + 1).join("/") + "/";
        const known = d.wp.byPath[url];
        return { label: known ? known.title : parts[i], url: i === parts.length - 1 || !known ? null : url };
      });
    },
  },
};
