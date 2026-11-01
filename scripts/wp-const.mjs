// Gemeinsame Festlegungen für Daten, Sitemaps und Prüfung
// Eigene Vorlagen (Startseite, Meldungsübersicht, Scheidungs-Landingpage)
export const OWN_TEMPLATE = new Set(["/", "/meldungen/", "/trennung-scheidung-unterhalt-zugewinn-sorgerecht-hausrat-versorgungsausgleich/"]);
// Entfallen, werden beim Umschalten weitergeleitet
export const DROPPED = new Set(["/apprentice-registration-page/", "/blog/"]);

// Alte Adressen, die in Beiträgen noch verlinkt sind oder von außen kommen können.
// Werden im Inhalt direkt korrigiert und beim Umschalten als 301-Weiterleitung eingerichtet.
export const REDIRECTS = {
  "/apprentice-registration-page/": "/",
  "/blog/": "/meldungen/",
  "/blawg/index.php": "/meldungen/",
  "/unterhalt": "/familienrecht/unterhalt/",
  "/scheidung": "/familienrecht/scheidung/",
  "/rechtliches/urheberrecht/": "/urheberrecht/",
  "/rechtliches/filesharing-abmahnung/": "/urheberrecht/filesharing-abmahnung/",
  "/rechtliches/verkehrsunfall-was-nun/": "/verkehrsrecht/verkehrsunfall/",
  "/rechtliches/bussgeldbescheid/": "/verkehrsrecht/bussgeldbescheid/",
  "/beauftragen/verkehrsordnungswidrigkeit/": "/verkehrsrecht/rechtsanwalt-verkehrsrecht/#Beauftragen",
};
