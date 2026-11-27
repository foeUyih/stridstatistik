let rawData = [];
let currentTab = 'imperier';
let minDayAvailable = 1;
let maxDayAvailable = 1;

async function init() {
  try {
    const res = await fetch('data.csv?t=' + Date.now());
    if (!res.ok) throw new Error("Hittade inte data.csv (HTTP " + res.status + ")");
    const text = await res.text();
    rawData = DataUtils.parseCSV(text);

    if (!rawData.length) {
      const preview = text.split(/\r?\n/).slice(0, 3).join("\n");
      document.getElementById('output').textContent =
        "⚠️ Filen data.csv laddades in, men 0 giltiga rader kunde tolkas.\n\n" +
        "Första 3 raderna i din data.csv ser ut så här:\n" + preview;
      document.getElementById('impList').textContent = "Inga giltiga rader hittades.";
      return;
    }

    setupControls();
    render();
  } catch (e) {
    document.getElementById('output').textContent =
      "Kunde inte ladda data.csv automatiskt (" + e.message + ").\n\n" +
      "Ladda upp data.csv i samma mapp på GitHub som index.html, eller klistra in din rådata i rutan till vänster!";
    document.getElementById('impList').textContent = "Ingen data laddad.";
  }
}

function loadPastedData() {
  const txt = document.getElementById('rawPaste').value;
  if (!txt.trim()) return;
  rawData = DataUtils.parseCSV(txt);
  setupControls();
  render();
  showStatus("✅ Inläst " + rawData.length + " rader!");
}

function setupControls() {
  if (!rawData.length) return;
  const days = rawData.map(r => r.dag);
  minDayAvailable = Math.min(...days);
  maxDayAvailable = Math.max(...days);
  document.getElementById('startDag').value = minDayAvailable;
  document.getElementById('slutDag').value = maxDayAvailable;

  const impMap = {};
  rawData.forEach(r => { impMap[r.imp] = (impMap[r.imp] || 0) + r.strider; });
  const sortedImps = Object.keys(impMap).sort((a, b) => impMap[b] - impMap[a]);

  const listEl = document.getElementById('impList');
  listEl.innerHTML = sortedImps.map(imp => `
    <div class="imp-row" data-name="${imp.toLowerCase()}">
      <label><input type="checkbox" class="imp-check" value="${imp}" onchange="render()"> ${imp}</label>
      <label class="paren-toggle" title="Visa inom parentes"><input type="checkbox" class="paren-check" value="${imp}" onchange="render()"> ( )</label>
    </div>
  `).join("");
}

function setDays(mode) {
  if (mode === 'latest') {
    document.getElementById('startDag').value = maxDayAvailable;
    document.getElementById('slutDag').value = maxDayAvailable;
  } else if (mode === 'last3') {
    document.getElementById('startDag').value = Math.max(minDayAvailable, maxDayAvailable - 2);
    document.getElementById('slutDag').value = maxDayAvailable;
  } else {
    document.getElementById('startDag').value = minDayAvailable;
    document.getElementById('slutDag').value = maxDayAvailable;
  }
  render();
}

function filterImpList() {
  const q = document.getElementById('impSearch').value.toLowerCase();
  document.querySelectorAll('.imp-row').forEach(row => {
    row.style.display = row.dataset.name.includes(q) ? 'flex' : 'none';
  });
}

function clearImps() {
  document.querySelectorAll('.imp-check, .paren-check').forEach(c => c.checked = false);
  render();
}

function setTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function render() {
  if (!rawData.length) return;
  const startDag = parseInt(document.getElementById('startDag').value, 10) || minDayAvailable;
  const slutDag = parseInt(document.getElementById('slutDag').value, 10) || maxDayAvailable;
  const rawStarImp = document.getElementById('starImp').value.trim();

  const ctx = {
    rawData,
    startDag,
    slutDag,
    periodDagar: Math.max(1, slutDag - startDag + 1),
    ärEnskild: startDag === slutDag,
    periodRubrik: startDag === slutDag ? `DAG ${startDag}` : `DAG ${startDag}–${slutDag}`,
    rawStarImp,
    starImp: rawStarImp.toLowerCase(),
    topLimit: parseInt(document.getElementById('topLimit').value, 10) || 20,
    selectedImps: Array.from(document.querySelectorAll('.imp-check:checked')).map(c => c.value),
    parenImps: Array.from(document.querySelectorAll('.paren-check:checked')).map(c => c.value),
    perData: rawData.filter(r => r.dag >= startDag && r.dag <= slutDag),
    dagData: rawData.filter(r => r.dag === slutDag)
  };

  const reportFn = Reports[currentTab];
  document.getElementById('output').textContent = reportFn ? reportFn(ctx) : "Okänd flik.";
}

function copyResult() {
  const txt = document.getElementById('output').textContent;
  navigator.clipboard.writeText(txt).then(() => {
    showStatus("✅ Kopierat! Klistra in i spelet med Ctrl+V.");
  });
}

function showStatus(msg) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  setTimeout(() => { el.textContent = "Redo att kopiera"; }, 3500);
}

['startDag', 'slutDag', 'starImp', 'topLimit'].forEach(id => {
  document.getElementById(id).addEventListener('input', render);
});

init();
