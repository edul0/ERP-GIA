export function parseDecimal(value: string): number | null {
  const text = value.trim();
  if (!text || text === ',' || text === '.') return null;
  const normalized = text.includes(',')
    ? text.replaceAll('.', '').replace(',', '.')
    : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function formatDecimal(value: number | string | null | undefined, fractionDigits = 2): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return '';
  return new Intl.NumberFormat('pt-BR', {
    useGrouping: false,
    maximumFractionDigits: fractionDigits,
  }).format(number);
}
