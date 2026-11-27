const DataUtils = {
  cleanName(str) {
    if (!str) return "";
    return str.replace(/[^a-zA-ZåäöÅÄÖéÉüÜ0-9\s\.\-\?]/g, "").trim();
  },

  cleanNum(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const cleaned = String(str).replace(/[^\d\-]/g, "");
    return cleaned ? parseInt(cleaned, 10) : 0;
  },

  fmt(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  },

  fmtDec(num) {
    return num.toFixed(1).replace(".", ",");
  },

  median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s.at(mid) : (s.at(mid - 1) + s.at(mid)) / 2;
  },

  parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
    if (!lines.length) return [];
    const firstLine = lines.at(0);
    const sep = firstLine.includes("\t") ? "\t" : (firstLine.includes(";") ? ";" : ",");
    const rows = [];

    for (let i = 0; i < lines.length; i++) {
      const cols = [];
      let cur = "", inQuotes = false;
      for (const ch of lines.at(i)) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === sep && !inQuotes) { cols.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      cols.push(cur.trim());

      const dag = parseInt(cols.at(0), 10);
      if (isNaN(dag)) continue;
      const spelare = cols.at(2) || "";
      const imp = this.cleanName(cols.at(3) || "");
      const pts = this.cleanNum(cols.at(5));
      const strider = this.cleanNum(cols.at(9));
      if (spelare && imp) {
        rows.push({ dag, spelare, imp, pts, strider });
      }
    }
    return rows;
  }
};
