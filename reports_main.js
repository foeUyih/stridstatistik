function formateraTal(tal) {
  return Math.round(tal).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formateraDecimal(tal) {
  return tal.toFixed(1).replace(".", ",");
}

function beraknaMedian(lista) {
  if (lista.length === 0) return 0;
  const sorterad = [...lista].sort((a, b) => a - b);
  const mitt = Math.floor(sorterad.length / 2);
  return sorterad.length % 2 !== 0
    ? sorterad.at(mitt)
    : (sorterad.at(mitt - 1) + sorterad.at(mitt)) / 2;
}

function skapaImperieRapport(info) {
  const { periodData, franDag, tillDag, arEnskild, rubrikPeriod, valdaImp, parentesImp, antalTopp, stjarnLag } = info;
  const karta = {};

  periodData.forEach(rad => {
    if (!karta[rad.imperium]) {
      karta[rad.imperium] = { namn: rad.imperium, totStrider: 0, totSpelare: new Set(), dagStrider: 0, dagSpelare: new Set() };
    }
    karta[rad.imperium].totStrider += rad.strider;
    karta[rad.imperium].totSpelare.add(rad.spelare);
    if (rad.dag === tillDag) {
      karta[rad.imperium].dagStrider += rad.strider;
      karta[rad.imperium].dagSpelare.add(rad.spelare);
    }
  });

  const sorterade = Object.values(karta)
    .sort((a, b) => b.totStrider - a.totStrider)
    .map((imp, idx) => ({ ...imp, plac: idx + 1 }));

  const visade = valdaImp.length > 0 ? sorterade.filter(i => valdaImp.includes(i.namn)) : sorterade.slice(0, antalTopp);
  const underRubrik = arEnskild ? `(Dag ${franDag} (spelare) • Enskild dag)` : `(Dag ${tillDag} (spelare) • Totalt Dag ${franDag}–${tillDag})`;

  let text = `══ 📊 STRIDSSTATISTIK – ${rubrikPeriod} ══\n${underRubrik}\n\n`;
  text += visade.map(imp => {
    const namn = parentesImp.includes(imp.namn) ? `(${imp.namn})` : imp.namn;
    const prefix = (stjarnLag && imp.namn.toLowerCase().includes(stjarnLag)) ? "⭐ " : "";
    return `${prefix}${imp.plac}. ${namn}\n   ↳ ⚔️ ${formateraTal(imp.dagStrider)} (${imp.dagSpelare.size})  •  ⚔️ ${formateraTal(imp.totStrider)} (${imp.totSpelare.size})`;
  }).join("\n\n");

  return text + `\n\n────────────────────\nℹ️ Källa: https://foestats.com (Topp 200 spelare/dag)`;
}

function skapaSpelarRapport(info) {
  const { periodData, franDag, tillDag, arEnskild, rubrikPeriod, valdaImp, antalTopp, stjarnLag } = info;
  const karta = {};

  periodData.forEach(rad => {
    if (!karta[rad.spelare]) {
      karta[rad.spelare] = { namn: rad.spelare, imperium: rad.imperium, totStrider: 0, dagStrider: 0, dagar: new Set() };
    }
    karta[rad.spelare].imperium = rad.imperium;
    karta[rad.spelare].totStrider += rad.strider;
    karta[rad.spelare].dagar.add(rad.dag);
    if (rad.dag === tillDag) karta[rad.spelare].dagStrider += rad.strider;
  });

  const sorterade = Object.values(karta)
    .sort((a, b) => b.totStrider - a.totStrider)
    .map((sp, idx) => ({ ...sp, plac: idx + 1 }));

  const filtrerade = valdaImp.length > 0 ? sorterade.filter(s => valdaImp.includes(s.imperium)) : sorterade;
  const topp = filtrerade.slice(0, antalTopp);
  const underRubrik = arEnskild ? `(Strider Dag ${franDag})` : `(Dag ${tillDag} • Totalt Dag ${franDag}–${tillDag} (dagar i topp 200))`;

  let text = `══ 📊 SPELARSTATISTIK TOPP ${topp.length} – ${rubrikPeriod} ══\n${underRubrik}\n\n`;
  text += topp.map(sp => {
    const prefix = (stjarnLag && sp.imperium.toLowerCase().includes(stjarnLag)) ? "⭐ " : "";
    return `${prefix}${sp.plac}. ${sp.namn} [${sp.imperium}] • ⚔️ ${formateraTal(sp.dagStrider)} • ⚔️ ${formateraTal(sp.totStrider)} (${sp.dagar.size} dgr)`;
  }).join("\n\n");

  return text + `\n\n────────────────────\nℹ️ Källa: https://foestats.com (Topp 200 spelare/dag)`;
}

function skapaEffektivitetsRapport(info) {
  const { periodData, franDag, tillDag, periodDagar, arEnskild, rubrikPeriod, valdaImp, antalTopp, stjarnLag } = info;
  const karta = {};

  periodData.forEach(rad => {
    if (!karta[rad.spelare]) {
      karta[rad.spelare] = { namn: rad.spelare, imperium: rad.imperium, totStrider: 0, kvoter: [], antalDgr: 0 };
    }
    karta[rad.spelare].imperium = rad.imperium;
    karta[rad.spelare].totStrider += rad.strider;
    karta[rad.spelare].antalDgr += 1;
    const kvot = rad.points <= 0 ? 0 : (rad.strider / rad.points) * 100000;
    karta[rad.spelare].kvoter.push(kvot);
  });

  const sorterade = Object.values(karta).map(sp => {
    const med = beraknaMedian(sp.kvoter);
    const index = ((sp.totStrider / periodDagar) / 100) * med;
    return { ...sp, index };
  }).sort((a, b) => b.index - a.index).map((sp, idx) => ({ ...sp, plac: idx + 1 }));

  const filtrerade = valdaImp.length > 0 ? sorterade.filter(s => valdaImp.includes(s.imperium)) : sorterade;
  const topp = filtrerade.slice(0, antalTopp);
  const underRubrik = arEnskild ? `(Viktat stridsindex • Enskild dag)` : `(Viktat stridsindex • Antal dagar i topp 200 under Dag ${franDag}–${tillDag})`;

  let text = `══ ⚔️ STRIDSINDEX TOPP ${topp.length} – ${rubrikPeriod} ══\n${underRubrik}\n\n`;
  text += topp.map(sp => {
    const prefix = (stjarnLag && sp.imperium.toLowerCase().includes(stjarnLag)) ? "⭐ " : "";
    return `${prefix}${sp.plac}. ${sp.namn} [${sp.imperium}] • ⚔️ ${formateraDecimal(sp.index)} (${sp.antalDgr} dgr)`;
  }).join("\n\n");

  return text + `\n\n────────────────────\nℹ️ Källa: https://foestats.com (Topp 200 spelare/dag)`;
}

function skapaHojdpunkterRapport(info) {
  const { periodData, dagData, tillDag, periodDagar, rubrikPeriod } = info;

  const impKarta = {};
  periodData.forEach(rad => {
    if (!impKarta[rad.imperium]) impKarta[rad.imperium] = { namn: rad.imperium, tot: 0, sp: new Set() };
    impKarta[rad.imperium].tot += rad.strider;
    impKarta[rad.imperium].sp.add(rad.spelare);
  });
  const impLista = Object.values(impKarta).map(i => ({
    ...i,
    snitt: i.sp.size >= 5 ? (i.tot / i.sp.size) / periodDagar : 0
  }));

  const sorteraTot = [...impLista].sort((a, b) => b.tot - a.tot);
  const ettaImp = sorteraTot.at(0) || { namn: "-", tot: 0, sp: new Set() };
  const tvaaImp = sorteraTot.at(1) || { namn: "Ingen", tot: 0 };
  const bredastImp = [...impLista].sort((a, b) => b.sp.size - a.sp.size).at(0) || { namn: "-", sp: new Set() };
  const snittImp = [...impLista].sort((a, b) => b.snitt - a.snitt).at(0) || { namn: "-", snitt: 0 };

  const bastDagSp = [...dagData].sort((a, b) => b.strider - a.strider).at(0) || { spelare: "-", imperium: "-", strider: 0 };
  const serverTot = dagData.reduce((sum, r) => sum + r.strider, 0);

  const spKarta = {};
  periodData.forEach(rad => {
    if (!spKarta[rad.spelare]) spKarta[rad.spelare] = { namn: rad.spelare, imperium: rad.imperium, tot: 0, dgr: 0, kvoter: [] };
    spKarta[rad.spelare].imperium = rad.imperium;
    spKarta[rad.spelare].tot += rad.strider;
    spKarta[rad.spelare].dgr += 1;
    spKarta[rad.spelare].kvoter.push(rad.points <= 0 ? 0 : (rad.strider / rad.points) * 100000);
  });
  const spLista = Object.values(spKarta).map(s => ({
    ...s,
    index: ((s.tot / periodDagar) / 100) * beraknaMedian(s.kvoter)
  }));
  const bastPerSp = [...spLista].sort((a, b) => b.tot - a.tot).at(0) || { namn: "-", imperium: "-", tot: 0, dgr: 0 };
  const bastEffSp = [...spLista].sort((a, b) => b.index - a.index).at(0) || { namn: "-", imperium: "-", index: 0, dgr: 0 };

  const forraDag = tillDag - 1;
  const forraData = allaRader.filter(r => r.dag === forraDag);
  let klattrareText = "Ingen föregående dag att jämföra med";
  if (forraData.length > 0) {
    const klattrare = dagData.map(r => {
      const igar = forraData.find(f => f.spelare === r.spelare)?.strider || 0;
      return { namn: r.spelare, imperium: r.imperium, diff: r.strider - igar, idag: r.strider };
    }).sort((a, b) => b.diff - a.diff).at(0);
    if (klattrare) {
      klattrareText = `${klattrare.namn} [${klattrare.imperium}] – +${formateraTal(klattrare.diff)} strider (tot. ${formateraTal(klattrare.idag)})`;
    }
  }

  return `══ 🏆 HÖJDPUNKTER – ${rubrikPeriod} ══\n\n` +
    `🔥 Mest aktiva imperium (${rubrikPeriod.toLowerCase()}):\n   ↳ ${ettaImp.namn} – ${formateraTal(ettaImp.tot)} strider (${ettaImp.sp.size} unika spelare)\n\n` +
    `⚖️ Toppstriden (1:an vs 2:an):\n   ↳ ${ettaImp.namn} leder före ${tvaaImp.namn} med ${formateraTal(ettaImp.tot - tvaaImp.tot)} strider\n\n` +
    `👥 Bredaste trupp (${rubrikPeriod.toLowerCase()}):\n   ↳ ${bredastImp.namn} – ${bredastImp.sp.size} unika spelare i topp 200\n\n` +
    `🎯 Bäst snitt/dag per spelare (min. 5 st):\n   ↳ ${snittImp.namn} – ${formateraTal(snittImp.snitt)} strider/dag\n\n` +
    `⚔️ Bästa enskilda dagsprestation (Dag ${tillDag}):\n   ↳ ${bastDagSp.spelare} [${bastDagSp.imperium}] – ${formateraTal(bastDagSp.strider)} strider\n\n` +
    `📈 Dagens klättrare (Dag ${forraDag} → ${tillDag}):\n   ↳ ${klattrareText}\n\n` +
    `🏅 Flest strider totalt (${rubrikPeriod.toLowerCase()}):\n   ↳ ${bastPerSp.namn} [${bastPerSp.imperium}] – ${formateraTal(bastPerSp.tot)} strider (${bastPerSp.dgr}/${periodDagar} dgr)\n\n` +
    `⚡ Mest effektiva spelare (${rubrikPeriod.toLowerCase()}):\n   ↳ ${bastEffSp.namn} [${bastEffSp.imperium}] – index ${formateraDecimal(bastEffSp.index)} (${bastEffSp.dgr}/${periodDagar} dgr)\n\n` +
    `🌡️ Totalt i topp 200 (Dag ${tillDag}): ${formateraTal(serverTot)} strider (snitt ${formateraTal(serverTot / 200)}/spelare)\n────────────────────\nℹ️ Källa: https://foestats.com (Topp 200 spelare/dag)`;
}
