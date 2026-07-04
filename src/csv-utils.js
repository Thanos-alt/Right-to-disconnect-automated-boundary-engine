function escapeCell(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsvFromExec(execResult) {
  // execResult: { columns: [], values: [[...],[...]] }
  if (!execResult || !execResult.columns) return '';
  const header = execResult.columns.join(',');
  const lines = execResult.values.map(row => row.map(cell => escapeCell(cell)).join(','));
  return [header].concat(lines).join('\n');
}

function parseSimpleCsv(text) {
  // very small parser: splits by lines and commas, supports quoted values
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = cols[j] === undefined ? '' : cols[j];
    rows.push(obj);
  }
  return rows;
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i+1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += ch;
    } else {
      if (ch === ',') { result.push(cur); cur = ''; }
      else if (ch === '"') { inQuotes = true; }
      else cur += ch;
    }
  }
  result.push(cur);
  return result;
}

module.exports = { toCsvFromExec, parseSimpleCsv };
