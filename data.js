async function laddaData() {
  const statusEl = document.getElementById("status");
  const tbody = document.querySelector("#dataTable tbody");

  try {
    const svar = await fetch("data.csv");
    if (!svar.ok) {
      throw new Error("Kunde inte hitta data.csv");
    }

    const text = await svar.text();
    const rader = text.split(/\r?\n/).filter(rad => rad.trim() !== "");

    // Känn av om filen använder kommatecken eller semikolon
    const avgränsare = rader.at(0).includes(";") ? ";" : ",";
    let antalRader = 0;

    for (let i = 0; i < rader.length; i++) {
      const kolumner = rader.at(i).split(avgränsare);
      const dag = parseInt(kolumner.at(0), 10);

      // Hoppa över rubrikraden om första kolumnen inte är en siffra
      if (isNaN(dag)) continue;

      const spelare = kolumner.at(2) || "";
      const imperium = kolumner.at(3) || "";
      const points = kolumner.at(5) || "0";
      const strider = kolumner.at(9) || "0";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dag}</td>
        <td>${spelare}</td>
        <td>${imperium}</td>
        <td>${points}</td>
        <td>${strider}</td>
      `;
      tbody.appendChild(tr);
      antalRader++;
    }

    statusEl.textContent = `✅ Laddade in ${antalRader} rader från data.csv!`;

  } catch (fel) {
    statusEl.style.color = "#ef4444";
    statusEl.textContent = `❌ Fel: ${fel.message}`;
  }
}

laddaData();
