/* Kostenrechner Scheidung – rechnet im Browser, es werden keine Eingaben übertragen.
   Verfahrenswert: 3 Monatsnettoeinkommen beider Eheleute (§ 43 FamGKG, mindestens 3.000 €)
   + Versorgungsausgleich 10 % davon je Anrecht (§ 50 FamGKG, mindestens 1.000 €, wenn durchgeführt).
   Anwaltskosten: 1,3 Verfahrens- + 1,2 Terminsgebühr (§ 13 RVG) + 20 € Pauschale, zzgl. 19 % USt.
   Gerichtskosten: 2,0 Gebühren (KV 1110 FamGKG, Tabelle § 28 FamGKG).
   Tabellen: Stand KostBRÄG 2025 (gültig seit 1. Juni 2025), übernommen aus dem bisherigen Rechner. */
(function () {
  'use strict';
  var box = document.querySelector('[data-kostenrechner]');
  if (!box) return;
  // [Verfahrenswert bis, 1,0-Gebühr RVG, 1,0-Gebühr FamGKG]
  var TABLE = [[500,51.5,40],[1000,93,61],[1500,134.5,82],[2000,176,103],[3000,235.5,125.5],[4000,295,148],[5000,354.5,170.5],[6000,414,193],[7000,473.5,215.5],[8000,533,238],[9000,592.5,260.5],[10000,652,283],[13000,707,313.5],[16000,762,344],[19000,817,374.5],[22000,872,405],[25000,927,435.5],[30000,1013,476],[35000,1099,516.5],[40000,1185,557],[45000,1271,597.5],[50000,1357,638],[65000,1456.5,778],[80000,1556,918],[95000,1655.5,1058],[110000,1755,1198],[125000,1854.5,1338],[140000,1954,1478],[155000,2053.5,1618],[170000,2153,1758],[185000,2252.5,1898],[200000,2352,2038],[230000,2492,2248],[260000,2632,2458],[290000,2772,2668],[320000,2912,2878],[350000,3052,3088],[380000,3192,3298],[410000,3332,3508],[440000,3472,3718],[470000,3612,3928],[500000,3752,4138]];
  var MIN_EHE = 3000, MIN_VA = 1000;
  var eur = function (n) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR'; };
  var num = function (el) { var v = parseInt(String(el.value).replace(/[^0-9]/g, ''), 10); return isNaN(v) ? null : v; };
  var e1 = box.querySelector('[name=e1]'), e2 = box.querySelector('[name=e2]'), va = box.querySelector('[name=va]');
  var result = box.querySelector('.kr-result'), over = box.querySelector('.kr-over');

  function calc() {
    var a = num(e1), b = num(e2);
    if (a === null || b === null) { result.hidden = true; over.hidden = true; return; }
    var n = parseInt(va.value, 10) || 0;
    var ehe = Math.max((a + b) * 3, MIN_EHE);
    var vaw = n > 0 ? Math.max(ehe * n / 10, MIN_VA) : 0;
    var wert = ehe + vaw;
    var row = null;
    for (var i = 0; i < TABLE.length; i++) if (wert <= TABLE[i][0]) { row = TABLE[i]; break; }
    if (!row) { result.hidden = true; over.hidden = false; return; }
    var ra = (row[1] * 2.5 + 20) * 1.19, gk = row[2] * 2;
    box.querySelector('[data-out=ra]').textContent = eur(ra);
    box.querySelector('[data-out=gk]').textContent = eur(gk);
    box.querySelector('[data-out=sum]').textContent = eur(ra + gk);
    over.hidden = true; result.hidden = false;
  }
  [e1, e2].forEach(function (el) { el.addEventListener('input', calc); });
  va.addEventListener('change', calc);
  window.__kostenrechner = function (a, b, n) { e1.value = a; e2.value = b; va.value = String(n); calc(); return box.querySelector('[data-out=sum]').textContent; }; // für die automatische Prüfung
})();
