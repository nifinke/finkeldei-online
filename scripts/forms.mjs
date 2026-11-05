// Anfrageformulare der neuen Website (ersetzen Contact Form 7, FormCraft und das Thrive-Formular).
// Felder, Beschriftungen und Pflichtangaben wie auf der heutigen Website.
import { readFileSync } from "node:fs";
const ENDPOINT = JSON.parse(readFileSync("src/_data/site.json", "utf8")).formEndpoint;
const ESC = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const PRIVACY = (button) =>
  `Ihre Daten werden verschlüsselt an die Kanzlei übersandt. Ihre vorstehenden Daten werden elektronisch gespeichert. Mit dem Klick auf „${button}“ stimmen Sie zu. Sie können der Datenspeicherung jederzeit widersprechen und die Löschung Ihrer Daten verlangen. Über diese und weitere Rechte gibt unsere <a href="/datenschutz/" target="_blank" rel="noopener">Datenschutzerklärung</a> Auskunft.`;

const field = ({ name, label, type = "text", required = false, placeholder = "", help = "", autocomplete = "", inputmode = "", max = 300 }) => {
  const id = `fx-${name}-__ID__`;
  const attrs = `id="${id}" name="${name}"${required ? " required" : ""}${placeholder ? ` placeholder="${ESC(placeholder)}"` : ""}${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${inputmode ? ` inputmode="${inputmode}"` : ""}`;
  const input = type === "textarea"
    ? `<textarea ${attrs} rows="5" maxlength="${max}"></textarea>`
    : `<input type="${type}" ${attrs} maxlength="${max}">`;
  return `<div class="fx-field"><label for="${id}">${label}</label>${help ? `<p class="fx-help">${help}</p>` : ""}${input}</div>`;
};

const radios = (name, legend, options) =>
  `<fieldset class="fx-field fx-radios"><legend>${legend}</legend>${options.map((o, i) => `<label class="fx-radio"><input type="radio" name="${name}" value="${ESC(o)}"${i === 0 ? " required" : ""}><span>${o}</span></label>`).join("")}</fieldset>`;

const files = (help) =>
  `<div class="fx-field"><label for="fx-files-__ID__">Dokumente anhängen</label><p class="fx-help">${help}</p><input type="file" id="fx-files-__ID__" name="files[]" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx,application/pdf,image/*"><p class="fx-help fx-filehint">Bis zu 5 Dateien (PDF, JPG, PNG, HEIC, DOC, DOCX), je höchstens 10 MB.</p></div>`;

const FORMS = {
  kontakt: {
    button: "Senden",
    fields: () => [
      field({ name: "name", label: "Ihr Name (Pflichtfeld)", required: true, autocomplete: "name" }),
      field({ name: "email", label: "Ihre E-Mail-Adresse (Pflichtfeld)", type: "email", required: true, autocomplete: "email" }),
      field({ name: "betreff", label: "Betreff (Pflichtfeld)", required: true }),
      field({ name: "nachricht", label: "Ihre Nachricht (Pflichtfeld)", type: "textarea", required: true, max: 5000 }),
    ],
  },
  verkehrsrecht: {
    button: "Absenden",
    fields: () => [
      field({ name: "name", label: "Name", required: true, placeholder: "Bsp.: Max Mustermann", autocomplete: "name" }),
      field({ name: "telefon", label: "Telefon", type: "tel", required: true, placeholder: "Bsp.: 0177/8456719", autocomplete: "tel", inputmode: "tel" }),
      field({ name: "email", label: "E-Mail", type: "email", required: true, placeholder: "Bsp.: max.mustermann@aol.com", autocomplete: "email" }),
      radios("rechtsschutz", "Besteht Verkehrsrechtsschutz?", ["Ja", "Nein", "Ich weiß es nicht."]),
      files("Fügen Sie bitte die Dokumente bei, die Ihren Fall betreffen (z. B. Bußgeldbescheid, Anhörungsbogen, Zeugenfragebogen, Vorladung)"),
      field({ name: "nachricht", label: "Nur wenn Sie möchten, ...", type: "textarea", help: "... können Sie uns hier noch eine Textnachricht zukommen lassen.", max: 5000 }),
    ],
  },
  arbeitsrecht: {
    button: "Absenden",
    fields: () => [
      field({ name: "name", label: "Name", required: true, placeholder: "Bsp.: Max Mustermann", autocomplete: "name" }),
      field({ name: "telefon", label: "Telefon", type: "tel", required: true, placeholder: "Bsp.: 0177/8456719", autocomplete: "tel", inputmode: "tel" }),
      field({ name: "email", label: "E-Mail", type: "email", required: true, placeholder: "Bsp.: max.mustermann@aol.com", autocomplete: "email" }),
      radios("rechtsschutz", "Besteht Berufsrechtsschutz?", ["Ja", "Nein", "Ich weiß es nicht."]),
      files("Fügen Sie bitte die Dokumente bei, die Ihren Fall betreffen (z. B. Kündigung, Arbeitsvertrag)"),
      field({ name: "nachricht", label: "Nur wenn Sie möchten, ...", type: "textarea", help: "... können Sie uns hier noch eine Textnachricht zukommen lassen.", max: 5000 }),
    ],
  },
  nachricht: {
    button: "Nachricht absenden",
    fields: () => [
      field({ name: "name", label: "Name", required: true, placeholder: "Name", autocomplete: "name" }),
      field({ name: "email", label: "E-Mail", type: "email", required: true, placeholder: "E-Mail", autocomplete: "email" }),
      field({ name: "nachricht", label: "Text", type: "textarea", required: true, placeholder: "Text", max: 5000 }),
    ],
  },
};

let counter = 0;
export function formHtml(kind) {
  const f = FORMS[kind];
  if (!f) return "";
  const id = `${kind}-${++counter}`;
  const body = f.fields().join("").replaceAll("__ID__", id);
  return `<div class="fx-wrap"><form class="fx-form" data-fx-form="${kind}" method="post" enctype="multipart/form-data" action="${ENDPOINT}" novalidate>
<input type="hidden" name="form" value="${kind}">
<div class="fx-hp" aria-hidden="true"><label>Bitte freilassen<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
${body}
<p class="fx-privacy">${PRIVACY(f.button)}</p>
<p class="fx-error" role="alert" hidden></p>
<button type="submit" class="btn btn-navy fx-submit">${f.button}</button>
</form>
<div class="fx-success" role="status" tabindex="-1" hidden><b>Ihre Nachricht wurde erfolgreich gesendet. Vielen Dank!</b></div></div>`;
}
