let allaRader = [];

function tvattaNamn(text) {
  if (!text) return "";
  return text.replace(/[^a-zA-ZåäöÅÄÖéÉüÜ0-9\s\.\-\?]/g, "").trim();
}

function tvattaTal(text) {
  if (!text) return 0;
  const baraSiffror = String(text).replace(/[^\d\-]/g, "");
  return baraSiffror ? parseInt(baraSiffror, 10) : 0;
}

function formateraDatum(datumObj) {
  if (!datumObj || isNaN(datumObj.getTime())) return "";
  const ar = datumObj.getFullYear();
  const manad = String(datumObj.getMonth() + 1).padStart(2, "0");
  const dag = String(datumObj.getDate()).padStart(2, "0");
  const tim = String(datumObj.getHours()).padStart(2, "0");
  const min = String(datumObj.getMinutes()).padStart(2, "0");
  return `${ar}-${manad}-${dag} ${tim}:${min}`;
}

async function laddaData() {
  const statusEl = document.getElementById("status");

  try {
    const svar = await fetch("data.csv?v=" + Date.now());
    if (!svar.ok) throw new Error("Kunde inte hitta data.csv");

    // Hämta när data.csv senast ändrades på servern
    const lastMod = svar.headers.get("Last-Modified");
    const datumText = lastMod ? ` • Uppdaterad: ${formateraDatum(new Date(lastMod))}` : "";

    const text = await svar.text();
    const rader = text.split(/\r?\n/).filter(rad => rad.trim() !== "");
    const avgränsare = rader.at(0).includes(";") ? ";" : ",";

    allaRader = [];

    for (let i = 0; i < rader.length; i++) {
      const kolumner = rader.at(i).split(avgränsare);
      const dag = parseInt(kolumner.at(0), 10);
      if (isNaN(dag)) continue;

      const spelare = (kolumner.at(2) || "").trim();
      const imperium = tvattaNamn(kolumner.at(3));
      const points = tvattaTal(kolumner.at(5));
      const strider = tvattaTal(kolumner.at(9));

      if (spelare && imperium) {
        allaRader.push({ dag, spelare, imperium, points, strider });
      }
    }

    statusEl.textContent = `✅ Laddade in ${allaRader.length} giltiga rader!${datumText}`;

    if (typeof startaApp === "function") {
      startaApp();
    }

  } catch (fel) {
    statusEl.style.color = "#ef4444";
    statusEl.textContent = `❌ Fel: ${fel.message}`;
  }
}
