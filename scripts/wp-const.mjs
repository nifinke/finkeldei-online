// Gemeinsame Festlegungen für Daten, Sitemaps und Prüfung
// Eigene Vorlagen (Startseite, Meldungsübersicht, Scheidungs-Landingpage, Thrive-Landingpages)
export const LANDINGS = ["/verkehrsrecht/rechtsanwalt-verkehrsrecht/", "/arbeitsrecht/rechtsanwalt-arbeitsrecht/", "/familienrecht/scheidung/scheidungsanwalt/"];
export const OWN_TEMPLATE = new Set(["/", "/meldungen/", "/trennung-scheidung-unterhalt-zugewinn-sorgerecht-hausrat-versorgungsausgleich/", ...LANDINGS]);
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

// Gelöschte KI-Beiträge: liefern „410 Gone“ (übernommen aus den Yoast-Weiterleitungen)
export const GONE = [
  "/kuendigungsschutzklage-fristen-chancen-ablauf/",
  "/handyverstoss-am-steuer-bussfeld-folgen-2026/",
  "/kuendigungsschutzklage-rechte-fristen-2026/",
  "/trennungsjahr-scheidung-voraussetzungen-ablauf-2/",
  "/handyverstoss-auto-bussegeld-punkte-2026/",
  "/trennungsjahr-ablauf-regeln-rechtliche-tipps/",
  "/handyverstoss-am-steuer-bussgeld-punkte-einspruch/",
];
