export default { eleventyComputed: { seo: (d) => d.arc?.seo || { title: d.arc?.title } } };
