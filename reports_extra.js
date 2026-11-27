function skapaInternRapport(info) {
  const { periodData, periodDagar, rubrikPeriod, stjarnLagRaw } = info;
  if (!stjarnLagRaw) return "Skriv in ditt imperium i rutan 'Stjärna (⭐) för lag' i kontrollpanelen.";

  const lagData = periodData.filter(r => r.imperium.toLowerCase() === stjarnLagRaw.toLowerCase());
  const lagTot = lagData.reduce((sum, r) => sum + r.strider, 0);
  const karta = {};

  lagData.forEach(rad => {
    if (!karta[rad.spelare]) karta[rad.spelare] = { namn: rad.spelare, tot: 0, dagar: new Set() };
    karta[rad.spelare].tot += rad.strider;
    karta[rad.spelare].dagar.add(rad.dag);
  });

  const sorterade = Object.values(karta).sort((a, b) => b.tot - a.tot);
  if (sorterade.length === 0) return `Hittade inga spelare för "${stjarnLagRaw}" under vald period.`;

  let text = `══ 🛡️ INTERN TOPPLISTA: ${stjarnLagRaw.toUpperCase()} (${rubrikPeriod}) ══\n(Totalt • Snitt/dag • Andel av lagets strider)\n\n`;
  text += sorterade.map((sp, idx) => {
    const snitt = sp.tot / periodDagar;
    const andel = lagTot === 0 ? "0,0%" : ((sp.tot / lagTot) * 100).toFixed(1).replace(".", ",") + "%";
    return `${idx + 1}. ${sp.namn} • ⚔️ ${formateraTal(sp.tot)} (${formateraTal(snitt)}/dag • ${andel} • ${sp.dagar.size}/${periodDagar} dgr)`;
  }).join("\n\n");

  return text + `\n\n────────────────────\nTotalt ${sorterade.length} spelare i topp 200 • Summa: ${formateraTal(lagTot)} strider`;
}

function skapaDuellRapport(info) {
  const { periodData, franDag, tillDag, periodDagar, rubrikPeriod, valdaImp, stjarnLagRaw } = info;
  const lagEtt = valdaImp.at(0) || stjarnLagRaw || "Välj lag 1";
  const lagTva = valdaImp.at(1) || "Nemesis";

  const d1 = periodData.filter(r => r.imperium.toLowerCase() === lagEtt.toLowerCase());
  const d2 = periodData.filter(r => r.imperium.toLowerCase() === lagTva.toLowerCase());

  const tot1 = d1.reduce((sum, r) => sum + r.strider, 0);
  const tot2 = d2.reduce((sum, r) => sum + r.strider, 0);
  const diff = tot1 - tot2;
  const diffText = diff >= 0 ? `+${formateraTal(diff)}` : formateraTal(diff);

  const sp1 = new Set(d1.map(r => r.spelare)).size;
  const sp2 = new Set(d2.map(r => r.spelare)).size;
  const snitt1 = sp1 === 0 ? 0 : (tot1 / sp1) / periodDagar;
  const snitt2 = sp2 === 0 ? 0 : (tot2 / sp2) / periodDagar;

  let vinster1 = 0;
  let vinster2 = 0;
  for (let d = franDag; d <= tillDag; d++) {
    const s1 = d1.filter(r => r.dag === d).reduce((sum, r) => sum + r.strider, 0);
    const s2 = d2.filter(r => r.dag === d).reduce((sum, r) => sum + r.strider, 0);
    if (s1 > s2) vinster1++;
    else if (s2 > s1) vinster2++;
  }

  return `══ 🥊 RIVALDUELLEN (${rubrikPeriod}) ══\n${lagEtt}  VS  ${lagTva}\n\n` +
    `⚔️ Totala strider:\n   ↳ ${formateraTal(tot1)}  vs  ${formateraTal(tot2)}  (${diffText})\n\n` +
    `👥 Unika spelare i topp 200:\n   ↳ ${sp1} st  vs  ${sp2} st\n\n` +
    `🎯 Snitt/dag per aktiv spelare:\n   ↳ ${formateraTal(snitt1)}  vs  ${formateraTal(snitt2)} strider/dag\n\n` +
    `🏆 Vunna dagar i inbördes möten:\n   ↳ ${vinster1} – ${vinster2}\n────────────────────`;
}

function skapaFormRapport(info) {
  const { periodData, franDag, tillDag, arEnskild, valdaImp, antalTopp, stjarnLag } = info;
  if (arEnskild) return "Välj minst 2 dagar (Från dag < Till dag) för att se formkurvan.";

  // Filtrera på ikryssade imperier, eller ta hela servern om inget är valt
  const filtreradData = valdaImp.length > 0
    ? periodData.filter(r => valdaImp.includes(r.imperium))
    : periodData;

  const dagSp = filtreradData.filter(r => r.dag === tillDag);

  const formLista = dagSp.map(rad => {
    const tidigare = filtreradData.filter(t => t.spelare === rad.spelare && t.dag < tillDag);
    const tidStr = tidigare.reduce((sum, x) => sum + x.strider, 0);
    const tidDgr = new Set(tidigare.map(x => x.dag)).size;
    const snitt = tidDgr === 0 ? 0 : tidStr / tidDgr;
    const okningPct = snitt === 0 ? 0 : ((rad.strider - snitt) / snitt) * 100;
    return { namn: rad.spelare, imperium: rad.imperium, idag: rad.strider, snitt, okningPct };
  }).filter(x => x.snitt > 0 && x.okningPct > 0)
    .sort((a, b) => b.okningPct - a.okningPct)
    .slice(0, antalTopp);

  if (formLista.length === 0) return `Inga spelare låg över sitt tidigare snitt under Dag ${tillDag}.`;

  const rubrikTag = valdaImp.length === 1 ? valdaImp.at(0).toUpperCase() : `TOPP ${formLista.length}`;
  let text = `══ 🔥 FORMKURVAN: ${rubrikTag} (DAG ${tillDag}) ══\n(Dagens strider vs. eget snitt Dag ${franDag}–${tillDag - 1})\n\n`;

  text += formLista.map((f, idx) => {
    const prefix = (stjarnLag && f.imperium.toLowerCase().includes(stjarnLag)) ? "⭐ " : "";
    return `${prefix}${idx + 1}. ${f.namn} [${f.imperium}] • 🔥 +${Math.round(f.okningPct)}% (${formateraTal(f.idag)} vs snitt ${formateraTal(f.snitt)})`;
  }).join("\n\n");

  return text + `\n\n────────────────────`;
}
