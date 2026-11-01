// PREVIEW=1 → Prototyp: Hinweisleiste, noindex
export default {
  preview: !!process.env.PREVIEW,
  noindex: !!process.env.PREVIEW || !!process.env.NOINDEX,
};
