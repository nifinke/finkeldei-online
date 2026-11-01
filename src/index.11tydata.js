export default {
  eleventyComputed: {
    seo: (d) => d.wp.home?.seo || {
      title: "Rechtsanwalt in Bottrop – Anwaltskanzlei Finkeldei",
      description: "Rechtsanwalt Nils Finkeldei in Bottrop: Scheidung, Bußgeldbescheid, Kündigung. Persönlich, telefonisch oder per Video.",
    },
  },
};
