export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function downloadCSV(name: string, rows: unknown[][]) {
  const blob = new Blob(['\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (char === ';' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(item => item.trim())) rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('CSV com aspas não fechadas.');
  row.push(cell); if (row.some(item => item.trim())) rows.push(row);
  return rows;
}
export function parseMoney(text = ''): number {
  const value = text.trim();
  if (!value) return 0;
  const normalized = value.includes(',') ? value.replaceAll('.', '').replace(',', '.') : value;
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) throw new Error(`Valor numérico inválido: ${value}`);
  return Number(normalized);
}
