// Kostenrechner Scheidung (ersetzt FormCraft). Texte wie im bisherigen Rechner; gerechnet wird im Browser (assets/js/kostenrechner.js).
export function calculatorHtml() {
  const opts = ['<option value="2">Ich weiß es nicht.</option>', ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<option value="${n}">${n}</option>`)].join("");
  return `<div class="kr" data-kostenrechner>
<p>Bitte geben Sie für beide Eheleute das durchschnittliche monatliche Nettoeinkommen an.</p>
<p class="kr-help">Geben Sie bitte möglichst genaue Werte an. Entscheidend ist das jeweilige monatliche Durchschnittsnetto. Dieses ermittelt man, indem man das Jahresnettoeinkommen durch 12 Monate dividiert.</p>
<p class="kr-help">Bezieht ein Ehegatte Sozialleistungen (z. B. Grundsicherungsgeld/Bürgergeld, Sozialhilfe, Grundsicherung im Alter) oder verfügt er über gar kein Einkommen oder ist sein Einkommen unbekannt, geben Sie bitte die Zahl 1000 ein.</p>
<div class="kr-row">
  <label class="kr-field"><span>Mein monatliches Nettoeinkommen in vollen EUR</span><input type="text" inputmode="numeric" pattern="[0-9.]*" name="e1" autocomplete="off" placeholder="z. B. 2500"></label>
  <label class="kr-field"><span>Monatliches Nettoeinkommen Ehepartner(in) in vollen EUR</span><input type="text" inputmode="numeric" pattern="[0-9.]*" name="e2" autocomplete="off" placeholder="z. B. 1800"></label>
</div>
<label class="kr-field"><span>Wie viele Versorgungsanwartschaften haben Sie und Ihr(e) Ehepartner(in) insgesamt?</span>
<details class="kr-more"><summary>Erläuterung</summary>
<p>Geben Sie bitte an, von wie vielen Stellen Sie und Ihr(e) Ehepartner(in) Versorgungsbezüge wegen Alters oder Erwerbsminderung beziehen oder zu erwarten haben (gesetzliche Rentenversicherung, private Rentenversicherung, betriebliche Rentenversicherung, berufsständischen Versorgungseinrichtung (Ärzteversorgung, Versorgungswerk der Rechtsanwälte, etc.), Beamtenversorgung).</p>
<p>Beispiel: Beide Eheleute sind berufstätig und zahlen in die gesetzliche Rentenversicherung ein. Zudem hat der Ehemann eine betriebliche und eine private Altersvorsorge. Insgesamt verfügen die Eheleute über vier Versorgungsanwartschaften.</p>
<p>Wenn in Ihrem Fall der Versorgungsausgleich ausnahmsweise nicht durchgeführt werden muss, weil Sie und Ihr(e) Ehepartner(in) dies etwa in einem Ehevertrag ausgeschlossen haben oder weil eine kurze Ehedauer vorliegt, geben Sie bitte 0 ein.</p>
<p>Sofern Sie nicht wissen, wie viele Versorgungsanwartschaften bestehen, rechnen wir mit insgesamt zwei Anwartschaften.</p>
</details>
<select name="va" aria-label="Zahl der Versorgungsanwartschaften">${opts}</select></label>
<div class="kr-result" aria-live="polite" hidden>
  <p class="kr-title">Kostenschätzung</p>
  <dl class="kr-sums">
    <div><dt>Anwaltskosten:</dt><dd>Die Anwaltskosten, die Ihnen als Antragsteller(in) entstehen werden, betragen voraussichtlich:<b data-out="ra"></b></dd></div>
    <div><dt>Gerichtskosten:</dt><dd>Hinzu kommen die Gerichtskosten in Höhe von voraussichtlich:<b data-out="gk"></b>Die Gerichtskosten müssen sich die Eheleute am Ende des Verfahrens hälftig teilen. Sie werden also am Ende nur die Hälfte dieses Betrages zu tragen haben. Trotzdem müssen die Gerichtskosten bei Einreichung des Scheidungsantrags in voller Höhe eingezahlt werden.</dd></div>
    <div class="kr-total"><dt>Gesamtkosten:</dt><dd>Die voraussichtlichen Gesamtkosten betragen also:<b data-out="sum"></b></dd></div>
  </dl>
  <p class="kr-help">Die Höhe der Anwalts- und Gerichtskosten ist abhängig vom sogenannten Verfahrenswert, den das Gericht erst am Ende des Gerichtsverfahrens festsetzen wird; und zwar nach Ermessen unter Berücksichtigung aller Umstände des Einzelfalls, insbesondere des Umfangs und der Bedeutung der Sache und der Vermögens- und Einkommensverhältnisse der Ehegatten. Die folgenden Beträge beruhen daher auf einem geschätzten Verfahrenswert. Die Kostenschätzung stellt eine unverbindliche Prognoserechnung dar.</p>
  <p class="kr-help">Ist es Ihnen finanziell nicht möglich, die Anwaltskosten und die Gerichtskosten für das Scheidungsverfahren zu stemmen, haben Sie möglicherweise Anspruch darauf, dass der Staat diese Kosten übernimmt (sogenannte Verfahrenskostenhilfe). Dies muss man zu Beginn des Scheidungsverfahrens beantragen und dem Antrag eine Selbstauskunft über die persönlichen und wirtschaftlichen Verhältnisse beifügen. Wenn für Sie die Bewilligung von Verfahrenskostenhilfe in Betracht kommt, werden wir dies beantragen.</p>
  <p class="kr-help">Übrigens: Ihr(e) Ehepartner(in) muss nicht zwingend auch einen Rechtsanwalt beauftragen. Es genügt ein Rechtsanwalt auf Antragstellerseite.</p>
</div>
<p class="kr-over" hidden>Bei einem so hohen Verfahrenswert schätzen wir die Kosten gern individuell. Bitte sprechen Sie uns an: 0 20 41 / 16 285 16.</p>
</div>`;
}
