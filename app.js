let aktivFlik = "imperier";

function startaApp() {
  if (allaRader.length === 0) return;

  const dagar = allaRader.map(r => r.dag);
  document.getElementById("franDag").value = Math.min(...dagar);
  document.getElementById("tillDag").value = Math.max(...dagar);

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

  ["franDag", "tillDag", "stjarnLag", "antalTopp"].forEach(id => {
    document.getElementById(id).addEventListener("input", uppdateraUtskrift);
  });

  uppdateraUtskrift();
}

function bytFlik(flik, knapp) {
  aktivFlik = flik;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  knapp.classList.add("active");
  uppdateraUtskrift();
}

function rensaVal() {
  document.querySelectorAll(".val-imp, .par-imp").forEach(cb => cb.checked = false);
  uppdateraUtskrift();
}

function uppdateraUtskrift() {
  const franDag = parseInt(document.getElementById("franDag").value, 10) || 1;
  const tillDag = parseInt(document.getElementById("tillDag").value, 10) || 1;
  const arEnskild = franDag === tillDag;
  const stjarnLagRaw = document.getElementById("stjarnLag").value.trim();

  const info = {
    franDag,
    tillDag,
    periodDagar: Math.max(1, tillDag - franDag + 1),
    arEnskild,
    rubrikPeriod: arEnskild ? `DAG ${franDag}` : `DAG ${franDag}–${tillDag}`,
    stjarnLagRaw,
    stjarnLag: stjarnLagRaw.toLowerCase(),
    antalTopp: parseInt(document.getElementById("antalTopp").value, 10) || 20,
    valdaImp: Array.from(document.querySelectorAll(".val-imp:checked")).map(cb => cb.value),
    parentesImp: Array.from(document.querySelectorAll(".par-imp:checked")).map(cb => cb.value),
    periodData: allaRader.filter(r => r.dag >= franDag && r.dag <= tillDag),
    dagData: allaRader.filter(r => r.dag === tillDag)
  };

  let resultat = "";
  if (aktivFlik === "imperier") resultat = skapaImperieRapport(info);
  else if (aktivFlik === "spelare") resultat = skapaSpelarRapport(info);
  else if (aktivFlik === "effektivitet") resultat = skapaEffektivitetsRapport(info);
  else if (aktivFlik === "hojdpunkter") resultat = skapaHojdpunkterRapport(info);
  else if (aktivFlik === "intern") resultat = skapaInternRapport(info);
  else if (aktivFlik === "duell") resultat = skapaDuellRapport(info);
  else if (aktivFlik === "form") resultat = skapaFormRapport(info);

  document.getElementById("utskrift").textContent = resultat;
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
