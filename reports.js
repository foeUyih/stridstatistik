const Reports = {
  imperier(ctx) {
    const { perData, slutDag, startDag, ärEnskild, periodRubrik, selectedImps, parenImps } = ctx;
    const { fmt } = DataUtils;
    const impMap = {};

    perData.forEach(r => {
      if (!impMap[r.imp]) impMap[r.imp] = { imp: r.imp, totStr: 0, totSp: new Set(), dagStr: 0, dagSp: new Set() };
      impMap[r.imp].totStr += r.strider;
      impMap[r.imp].totSp.add(r.spelare);
      if (r.dag === slutDag) {
        impMap[r.imp].dagStr += r.strider;
        impMap[r.imp].dagSp.add(r.spelare);
      }
    });

    const sorted = Object.values(impMap).sort((a, b) => b.totStr - a.totStr).map((item, idx) => ({ ...item, plac: idx + 1 }));
    const filtered = selectedImps.length > 0 ? sorted.filter(i => selectedImps.includes(i.imp)) : sorted.slice(0, 20);
    const underRubrik = ärEnskild ? `(Dag ${startDag} (spelare) • Enskild dag)` : `(Dag ${slutDag} (spelare) • Totalt Dag ${startDag}–${slutDag})`;

    let out = `══ 📊 STRIDSSTATISTIK – ${periodRubrik} ══\n${underRubrik}\n\n`;
    out += filtered.map(i => {
      const name = parenImps.includes(i.imp) ? `(${i.imp})` : i.imp;
      return `${i.plac}. ${name}\n   ↳ ⚔️ ${fmt(i.dagStr)} (${i.dagSp.size})  •  ⚔️ ${fmt(i.totStr)} (${i.totSp.size})`;
    }).join("\n\n");
    return out + `\n\n────────────────────\nℹ️ Källa: https://foestats.com (Topp 200 spelare/dag)`;
  },

  spelare(ctx) {
    const { perData, slutDag, startDag, ärEnskild, periodRubrik, selectedImps, topLimit, starImp } = ctx;
    const { fmt } = DataUtils;
    const spMap = {};

    perData.forEach(r => {
      if (!spMap[r.spelare]) spMap[r.spelare] = { sp: r.spelare, imp: r.imp, totStr: 0, dagStr: 0, dgr: new Set() };
      spMap[r.spelare].imp = r.imp;
      spMap[r.spelare].totStr += r.strider;
      spMap[r.spelare].dgr.add(r.dag);
      if (r.dag === slutDag) spMap[r.spelare].dagStr += r.strider;
    });

    const sorted = Object.values(spMap).sort((a, b) => b.totStr - a.totStr).map((item, idx) => ({ ...item, plac: idx + 1 }));
    const filtered = selectedImps.length > 0 ? sorted.filter(s => selectedImps.includes(s.imp)) : sorted;
    const topp = filtered.slice(0, topLimit);
    const underRubrik = ärEnskild ? `(Strider Dag ${startDag})` : `(Dag ${slutDag} • Totalt Dag ${startDag}–${slutDag} (dagar i topp 200))`;

    let out = `══ 📊 SPELARSTATISTIK TOPP ${topp.length} – ${periodRubrik} ══\n${underRubrik}\n\n`;
    out += topp.map(s => {
      const star = (starImp && s.imp.toLowerCase().includes(starImp)) ? "⭐ " : "";
      return `${star}${s.plac}. ${s.sp} [${s.imp}] • ⚔️ ${fmt(s.dagStr)} • ⚔️ ${fmt(s.totStr)} (${s.dgr.size} dgr)`;
    }).join("\n\n");
    return out + `\n\n────────────────────\nℹ️ Källa: https://foestats.com (Topp 200 spelare/dag)`;
  },

  effektivitet(ctx) {
    const { perData, slutDag, startDag, periodDagar, ärEnskild, periodRubrik, selectedImps, topLimit, starImp } = ctx;
    const { fmtDec, median } = DataUtils;
    const spMap = {};

    perData.forEach(r => {
      if (!spMap[r.spelare]) spMap[r.spelare] = { sp: r.spelare, imp: r.imp, totStr: 0, kvoter: [], dgr: 0 };
      spMap[r.spelare].imp = r.imp;
      spMap[r.spelare].totStr += r.strider;
      spMap[r.spelare].dgr += 1;
      spMap[r.spelare].kvoter.push(r.pts <= 0 ? 0 : (r.strider / r.pts) * 100000);
    });

    const sorted = Object.values(spMap).map(s => ({
      ...s,
      index: ((s.totStr / periodDagar) / 100) * median(s.kvoter)
    })).sort((a, b) => b.index - a.index).map((item, idx) => ({ ...item, plac: idx + 1 }));

    const filtered = selectedImps.length > 0 ? sorted.filter(s => selectedImps.includes(s.imp)) : sorted;
    const topp = filtered.slice(0, topLimit);
    const underRubrik = ärEnskild ? `(Viktat stridsindex • Enskild dag)` : `(Viktat stridsindex • Antal dagar i topp 200 under Dag ${startDag}–${slutDag})`;

    let out = `══ ⚔️ STRIDSINDEX TOPP ${topp.length} – ${periodRubrik} ══\n${underRubrik}\n\n`;
    out += topp.map(s => {
      const star = (starImp && s.imp.toLowerCase().includes(starImp)) ? "⭐ " : "";
      return `${star}${s.plac}. ${s.sp} [${s.imp}] • ⚔️ ${fmtDec(s.index)} (${s.dgr} dgr)`;
    }).join("\n\n");
    return out + `\n\n────────────────────\nℹ️ Källa: https://foestats.com`;
  },

  highlights(ctx) {
    const { rawData, perData, dagData, startDag, slutDag, periodDagar, ärEnskild, periodRubrik } = ctx;
    const { fmt, fmtDec, median } = DataUtils;

    const impMap = {};
    perData.forEach(r => {
      if (!impMap[r.imp]) impMap[r.imp] = { imp: r.imp, tot: 0, sp: new Set() };
      impMap[r.imp].tot += r.strider;
      impMap[r.imp].sp.add(r.spelare);
    });
    const impArr = Object.values(impMap).map(i => ({ ...i, snitt: i.sp.size >= 5 ? (i.tot / i.sp.size) / periodDagar : 0 }));
    const sortedByTot = [...impArr].sort((a, b) => b.tot - a.tot);
    const bästTotImp = sortedByTot.at(0) || { imp: "-", tot: 0, sp: new Set() };
    const tvåaTotImp = sortedByTot.at(1) || { imp: "Ingen", tot: 0 };
    const bredastImp = [...impArr].sort((a, b) => b.sp.size - a.sp.size).at(0) || { imp: "-", sp: new Set() };
    const bästSnittImp = [...impArr].sort((a, b) => b.snitt - a.snitt).at(0) || { imp: "-", snitt: 0 };

    const bästSpDag = [...dagData].sort((a, b) => b.strider - a.strider).at(0) || { spelare: "-", imp: "-", strider: 0 };
    const totServerDag = dagData.reduce((acc, r) => acc + r.strider, 0);

    const vinster = {};
    for (let d = startDag; d <= slutDag; d++) {
      const dRows = perData.filter(r => r.dag === d);
      const dImp = {};
      dRows.forEach(r => dImp[r.imp] = (dImp[r.imp] || 0) + r.strider);
      const vinnare = Object.keys(dImp).sort((a, b) => dImp[b] - dImp[a]).at(0);
      if (vinnare) vinster[vinnare] = (vinster[vinnare] || 0) + 1;
    }
    const mästareNamn = Object.keys(vinster).sort((a, b) => vinster[b] - vinster[a]).at(0) || "-";
    const mästareAntal = vinster[mästareNamn] || 0;

    const spMap = {};
    perData.forEach(r => {
      if (!spMap[r.spelare]) spMap[r.spelare] = { sp: r.spelare, imp: r.imp, tot: 0, dgr: 0, minStr: Infinity, kvoter: [] };
      spMap[r.spelare].imp = r.imp;
      spMap[r.spelare].tot += r.strider;
      spMap[r.spelare].dgr += 1;
      if (r.strider < spMap[r.spelare].minStr) spMap[r.spelare].minStr = r.strider;
      spMap[r.spelare].kvoter.push(r.pts <= 0 ? 0 : (r.strider / r.pts) * 100000);
    });
    const spArr = Object.values(spMap).map(s => ({
      ...s,
      index: ((s.tot / periodDagar) / 100) * median(s.kvoter),
      järn: s.dgr === periodDagar ? s.minStr : 0
    }));
    const bästSpPer = [...spArr].sort((a, b) => b.tot - a.tot).at(0) || { sp: "-", imp: "-", tot: 0, dgr: 0 };
    const bästEffSp = [...spArr].sort((a, b) => b.index - a.index).at(0) || { sp: "-", imp: "-", index: 0, dgr: 0 };
    const järn = [...spArr].sort((a, b) => b.järn - a.järn).at(0);
    const järnText = (järn && järn.järn > 0) ? `${järn.sp} [${järn.imp}] – minst ${fmt(järn.järn)} strider varje dag` : "Ingen spelare har varit med alla dagar";

    const förraDag = slutDag - 1;
    const förraData = rawData.filter(r => r.dag === förraDag);
    let raketSpText = "Ingen föregående dag";
    let raketImpText = "Ingen föregående dag";
    if (förraData.length > 0) {
      const raketSp = dagData.map(r => {
        const igår = förraData.find(f => f.spelare === r.spelare)?.strider || 0;
        return { sp: r.spelare, imp: r.imp, diff: r.strider - igår, idag: r.strider };
      }).sort((a, b) => b.diff - a.diff).at(0);
      if (raketSp) raketSpText = `${raketSp.sp} [${raketSp.imp}] – +${fmt(raketSp.diff)} strider (tot. ${fmt(raketSp.idag)})`;

      const impIdag = {}; dagData.forEach(r => impIdag[r.imp] = (impIdag[r.imp] || 0) + r.strider);
      const impIgår = {}; förraData.forEach(r => impIgår[r.imp] = (impIgår[r.imp] || 0) + r.strider);
      const raketImp = Object.keys(impIdag).map(imp => ({
        imp, diff: impIdag[imp] - (impIgår[imp] || 0), idag: impIdag[imp]
      })).sort((a, b) => b.diff - a.diff).at(0);
      if (raketImp) raketImpText = `${raketImp.imp} – +${fmt(raketImp.diff)} strider (tot. ${fmt(raketImp.idag)})`;
    }

    let nykomlingText = "Välj ett dagintervall för att se nykomlingar";
    if (!ärEnskild) {
      const tidigareSp = new Set(perData.filter(r => r.dag < slutDag).map(r => r.spelare));
      const nykomlingar = dagData.filter(r => !tidigareSp.has(r.spelare)).sort((a, b) => b.strider - a.strider);
      nykomlingText = nykomlingar.length > 0 ? `${nykomlingar.at(0).spelare} [${nykomlingar.at(0).imp}] – ${fmt(nykomlingar.at(0).strider)} strider` : "Inga nya spelare i topp 200 idag";
    }

    return `══ 🏆 HÖJDPUNKTER – ${periodRubrik} ══\n\n` +
      `🔥 Mest aktiva imperium (${periodRubrik.toLowerCase()}):\n   ↳ ${bästTotImp.imp} – ${fmt(bästTotImp.tot)} strider (${bästTotImp.sp.size} unika spelare)\n\n` +
      `⚖️ Toppstriden (1:an vs 2:an):\n   ↳ ${bästTotImp.imp} leder före ${tvåaTotImp.imp} med ${fmt(bästTotImp.tot - tvåaTotImp.tot)} strider\n\n` +
      `👑 Flest dagsvinster (${periodRubrik.toLowerCase()}):\n   ↳ ${mästareNamn} (${mästareAntal} av ${periodDagar} dgr)\n\n` +
      `🚀 Dagens imperieraket (Dag ${förraDag} → ${slutDag}):\n   ↳ ${raketImpText}\n\n` +
      `👥 Bredaste trupp (${periodRubrik.toLowerCase()}):\n   ↳ ${bredastImp.imp} – ${bredastImp.sp.size} unika spelare i topp 200\n\n` +
      `🎯 Bäst snitt/dag per spelare (min. 5 st):\n   ↳ ${bästSnittImp.imp} – ${fmt(bästSnittImp.snitt)} strider/dag\n\n` +
      `⚔️ Bästa enskilda dagsprestation (Dag ${slutDag}):\n   ↳ ${bästSpDag.spelare} [${bästSpDag.imp}] – ${fmt(bästSpDag.strider)} strider\n\n` +
      `📈 Dagens spelarraket (Dag ${förraDag} → ${slutDag}):\n   ↳ ${raketSpText}\n\n` +
      `🌟 Dagens nykomling (Dag ${slutDag}):\n   ↳ ${nykomlingText}\n\n` +
      `🧱 Järnmannen (högst lägstanivå alla dagar):\n   ↳ ${järnText}\n\n` +
      🏅 Flest strider totalt (${periodRubrik.toLowerCase()}):\n   ↳ ${bästSpPer.sp} [${bästSpPer.imp}] – ${fmt(bästSpPer.tot)} strider (${bästSpPer.dgr}/${periodDagar} dgr)\n\n +
⚡ Mest effektiva spelare (${periodRubrik.toLowerCase()}):\n   ↳ ${bästEffSp.sp} [${bästEffSp.imp}] – index ${fmtDec(bästEffSp.index)} (${bästEffSp.dgr}/${periodDagar} dgr)\n\n +
🌡️ Totalt i topp 200 (Dag ${slutDag}): ${fmt(totServerDag)} strider (snitt ${fmt(totServerDag/200)}/spelare)\n────────────────────;
},
intern(ctx) {
const { perData, periodDagar, periodRubrik, rawStarImp } = ctx;
const { fmt } = DataUtils;
const lagData = perData.filter(r => r.imp.toLowerCase() === rawStarImp.toLowerCase());
const lagTot = lagData.reduce((acc, r) => acc + r.strider, 0);
const spMap = {};
lagData.forEach(r => {
if (!spMap[r.spelare]) spMap[r.spelare] = { sp: r.spelare, tot: 0, dgr: new Set() };
spMap[r.spelare].tot += r.strider;
spMap[r.spelare].dgr.add(r.dag);
});
const sorted = Object.values(spMap).sort((a, b) => b.tot - a.tot);
let out = ══ 🛡️ INTERN TOPPLISTA: ${rawStarImp.toUpperCase()} (${periodRubrik}) ══\n(Totalt • Snitt/dag • Andel av lagets strider)\n\n;
out += sorted.map((s, idx) => {
const snitt = s.tot / periodDagar;
const andel = lagTot === 0 ? "0,0%" : ((s.tot / lagTot) * 100).toFixed(1).replace(".", ",") + "%";
return ${idx + 1}. ${s.sp} • ⚔️ ${fmt(s.tot)} (${fmt(snitt)}/dag • ${andel} • ${s.dgr.size}/${periodDagar} dgr);
}).join("\n\n");
return out + \n\n────────────────────\nTotalt ${sorted.length} spelare i topp 200 • Summa: ${fmt(lagTot)} strider;
},
duell(ctx) {
const { perData, startDag, slutDag, periodDagar, periodRubrik, selectedImps, rawStarImp } = ctx;
const { fmt } = DataUtils;
const lagEtt = selectedImps.at(0) || rawStarImp || "Välj lag 1";
const lagTvå = selectedImps.at(1) || "Nemesis";
const d1 = perData.filter(r => r.imp.toLowerCase() === lagEtt.toLowerCase());
const d2 = perData.filter(r => r.imp.toLowerCase() === lagTvå.toLowerCase());
const tot1 = d1.reduce((a, r) => a + r.strider, 0);
const tot2 = d2.reduce((a, r) => a + r.strider, 0);
const diff = tot1 - tot2;
const diffTxt = diff >= 0 ? +${fmt(diff)} : fmt(diff);
const sp1 = new Set(d1.map(r => r.spelare)).size;
const sp2 = new Set(d2.map(r => r.spelare)).size;
const snitt1 = sp1 === 0 ? 0 : (tot1 / sp1) / periodDagar;
const snitt2 = sp2 === 0 ? 0 : (tot2 / sp2) / periodDagar;
let v1 = 0, v2 = 0;
for (let d = startDag; d <= slutDag; d++) {
const s1 = d1.filter(r => r.dag === d).reduce((a, r) => a + r.strider, 0);
const s2 = d2.filter(r => r.dag === d).reduce((a, r) => a + r.strider, 0);
if (s1 > s2) v1++; else if (s2 > s1) v2++;
}
return ══ 🥊 RIVALDUELLEN (${periodRubrik}) ══\n${lagEtt}  VS  ${lagTvå}\n\n +
⚔️ Totala strider:\n   ↳ ${fmt(tot1)}  vs  ${fmt(tot2)}  (${diffTxt})\n\n +
👥 Unika spelare i topp 200:\n   ↳ ${sp1} st  vs  ${sp2} st\n\n +
🎯 Snitt/dag per aktiv spelare:\n   ↳ ${fmt(snitt1)}  vs  ${fmt(snitt2)} strider/dag\n\n +
🏆 Vunna dagar i inbördes möten:\n   ↳ ${v1} – ${v2}\n────────────────────;
},
form(ctx) {
const { perData, startDag, slutDag, ärEnskild, rawStarImp } = ctx;
const { fmt } = DataUtils;
if (ärEnskild) return "Välj minst 2 dagar i Från dag / Till dag för att se formkurvan.";
const lagData = perData.filter(r => r.imp.toLowerCase() === rawStarImp.toLowerCase());
const dagSp = lagData.filter(r => r.dag === slutDag);
const formList = dagSp.map(r => {
const tid = lagData.filter(t => t.spelare === r.spelare && t.dag < slutDag);
const tidStr = tid.reduce((a, x) => a + x.strider, 0);
const tidDgr = new Set(tid.map(x => x.dag)).size;
const snitt = tidDgr === 0 ? 0 : tidStr / tidDgr;
const pct = snitt === 0 ? 0 : ((r.strider - snitt) / snitt) * 100;
return { sp: r.spelare, idag: r.strider, snitt, pct };
}).filter(x => x.snitt > 0 && x.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 10);
if (!formList.length) return "Inga spelare över sitt tidigare snitt idag.";
let out = ══ 🔥 FORMKURVAN: ${rawStarImp.toUpperCase()} (DAG ${slutDag}) ══\n(Dagens strider vs. eget snitt Dag ${startDag}–${slutDag - 1})\n\n;
out += formList.map((f, idx) => ${idx + 1}. ${f.sp} • 🔥 +${Math.round(f.pct)}% (${fmt(f.idag)} vs snitt ${fmt(f.snitt)})).join("\n\n");
return out + \n\n────────────────────;
}
};
