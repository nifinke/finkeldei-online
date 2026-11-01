// PREVIEW=1 → Prototyp: Hinweisleiste, noindex
// version: ändert sich bei jedem Build, damit Browser das neue Stylesheet laden
export default {
  preview: !!process.env.PREVIEW,
  noindex: !!process.env.PREVIEW || !!process.env.NOINDEX,
  version: Date.now().toString(36),
};
