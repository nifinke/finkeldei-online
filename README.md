# finkeldei-online.de – statische Website

Neuaufbau von finkeldei-online.de: WordPress bleibt Redaktionssystem, die öffentliche Website wird mit [Eleventy](https://www.11ty.dev/) als statische Seiten erzeugt.

**Stand: Phase 1 (Prototyp).** Startseite, Scheidung, Bußgeldbescheid, Kündigung und ein Beispielbeitrag. Die Vorschau ist mit `noindex` für Suchmaschinen gesperrt.

| Ordner | Inhalt |
|---|---|
| `src/` | Vorlagen, Startseite, Stylesheet |
| `data/` | Inhalte aus WordPress (im Prototyp fest abgelegt, später automatisch abgerufen) |
| `scripts/` | Abruf aus WordPress, Bereinigung der Inhalte, Vorschau-Aufbereitung |

Lokal: `npm install`, dann `PREVIEW=1 npm run preview`.
