function formateraTal(tal) {
  return Math.round(tal).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function startaApp() {
  if (allaRader.length === 0) return;

  // 1. Sätt startdag och slutdag automatiskt
  const dagar = allaRader.map(r => r.dag);
  document.getElementById("franDag").value = Math.min(...dagar);
  document.getElementById("tillDag").value = Math.max(...dagar);

  // 2. Bygg listan med imperier sorterad efter totala strider
  const impSumma = {};
  allaRader.forEach(r => {
    impSumma[r.imperium] = (impSumma[r.imperium] || 0) + r.strider;
  });
  const unikaImp = Object.keys(impSumma).sort((a, b) => impSumma[b] - impSumma[a]);

  const listaEl = document.getElementById("imperieLista");
  listaEl.innerHTML = unikaImp.map(imp => `
    <div class="imp-rad">
      <label><input type="checkbox" class="val-imp" value="${imp}" onchange="uppdateraUtskrift()"> ${imp}</label>
      <label><input type="checkbox" class="par-imp" value="${imp}" onchange="uppdateraUtskrift()"> ( )</label>
    </div>
  `).join("");

  // 3. Lyssna på ändringar i kontrollpanelen
  document.getElementById("franDag").addEventListener("input", uppdateraUtskrift);
  document.getElementById("tillDag").addEventListener("input", uppdateraUtskrift);
  document.getElementById("stjarnLag").addEventListener("input", uppdateraUtskrift);

  uppdateraUtskrift();
}

function rensaVal() {
  document.querySelectorAll(".val-imp, .par-imp").forEach(cb => cb.checked = false);
  uppdateraUtskrift();
}

function uppdateraUtskrift() {
  const franDag = parseInt(document.getElementById("franDag").value, 10) || 1;
  const tillDag = parseInt(document.getElementById("tillDag").value, 10) || 1;
  const stjarnLag = document.getElementById("stjarnLag").value.trim().toLowerCase();
  const arEnskild = franDag === tillDag;

  // Läs av ikryssade imperier och parenteser
  const valdaImp = Array.from(document.querySelectorAll(".val-imp:checked")).map(cb => cb.value);
  const parentesImp = Array.from(document.querySelectorAll(".par-imp:checked")).map(cb => cb.value);

  const periodData = allaRader.filter(r => r.dag >= franDag && r.dag <= tillDag);
  const imperieKarta = {};

  periodData.forEach(rad => {
    if (!imperieKarta[rad.imperium]) {
      imperieKarta[rad.imperium] = {
        namn: rad.imperium,
        totStrider: 0,
        totSpelare: new Set(),
        dagStrider: 0,
        dagSpelare: new Set()
      };
    }

    imperieKarta[rad.imperium].totStrider += rad.strider;
    imperieKarta[rad.imperium].totSpelare.add(rad.spelare);

    if (rad.dag === tillDag) {
      imperieKarta[rad.imperium].dagStrider += rad.strider;
      imperieKarta[rad.imperium].dagSpelare.add(rad.spelare);
    }
  });

  // Sortera alla och behåll deras riktiga serverplacering
  const allaSorterade = Object.values(imperieKarta)
    .sort((a, b) => b.totStrider - a.totStrider)
    .map((imp, idx) => ({ ...imp, plac: idx + 1 }));

  // Visa valda imperier, eller Topp 20 om inget är ikryssat
  const visade = valdaImp.length > 0
    ? allaSorterade.filter(imp => valdaImp.includes(imp.namn))
    : allaSorterade.slice(0, 20);

  const rubrikPeriod = arEnskild ? `DAG ${franDag}` : `DAG ${franDag}–${tillDag}`;
  const underRubrik = arEnskild
    ? `(Dag ${franDag} (spelare) • Enskild dag)`
    : `(Dag ${tillDag} (spelare) • Totalt Dag ${franDag}–${tillDag})`;

  let text = `══ 📊 STRIDSSTATISTIK – ${rubrikPeriod} ══\n${underRubrik}\n\n`;

  text += visade.map(imp => {
    const visatNamn = parentesImp.includes(imp.namn) ? `(${imp.namn})` : imp.namn;
    const prefix = (stjarnLag && imp.namn.toLowerCase().includes(stjarnLag)) ? "⭐ " : "";
    return `${prefix}${imp.plac}. ${visatNamn}\n   ↳ ⚔️ ${formateraTal(imp.dagStrider)} (${imp.dagSpelare.size})  •  ⚔️ ${formateraTal(imp.totStrider)} (${imp.totSpelare.size})`;
  }).join("\n\n");

  text += `\n\n────────────────────\nℹ️ Källa: https://foestats.com (Topp 200 spelare/dag)`;

  document.getElementById("utskrift").textContent = text;
}

function kopieraText() {
  const text = document.getElementById("utskrift").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("kopieraBtn");
    btn.textContent = "✅ Kopierat!";
    setTimeout(() => { btn.textContent = "📋 Kopiera till spelet"; }, 2500);
  });
}

laddaData();
