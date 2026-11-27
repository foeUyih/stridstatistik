function formateraTal(tal) {
  return Math.round(tal).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function startaApp() {
  if (allaRader.length === 0) return;

  // Hitta lägsta och högsta dag i filen automatiskt
  const dagar = allaRader.map(r => r.dag);
  document.getElementById("franDag").value = Math.min(...dagar);
  document.getElementById("tillDag").value = Math.max(...dagar);

  // Lyssna på ändringar i dag-rutorna
  document.getElementById("franDag").addEventListener("input", uppdateraUtskrift);
  document.getElementById("tillDag").addEventListener("input", uppdateraUtskrift);

  uppdateraUtskrift();
}

function uppdateraUtskrift() {
  const franDag = parseInt(document.getElementById("franDag").value, 10) || 1;
  const tillDag = parseInt(document.getElementById("tillDag").value, 10) || 1;
  const arEnskild = franDag === tillDag;

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

  // Sortera efter totalt antal strider och ta Topp 20
  const sorterade = Object.values(imperieKarta)
    .sort((a, b) => b.totStrider - a.totStrider)
    .slice(0, 20);

  const rubrikPeriod = arEnskild ? `DAG ${franDag}` : `DAG ${franDag}–${tillDag}`;
  const underRubrik = arEnskild
    ? `(Dag ${franDag} (spelare) • Enskild dag)`
    : `(Dag ${tillDag} (spelare) • Totalt Dag ${franDag}–${tillDag})`;

  let text = `══ 📊 STRIDSSTATISTIK – ${rubrikPeriod} ══\n${underRubrik}\n\n`;

  text += sorterade.map((imp, index) => {
    const plac = index + 1;
    return `${plac}. ${imp.namn}\n   ↳ ⚔️ ${formateraTal(imp.dagStrider)} (${imp.dagSpelare.size})  •  ⚔️ ${formateraTal(imp.totStrider)} (${imp.totSpelare.size})`;
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
