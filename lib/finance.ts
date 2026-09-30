import type { Expense } from '../types';

export const costFields = ['fueling', 'driverExpenses', 'toll', 'thirdPartyFreight', 'seguro', 'loadingUnloading', 'fines', 'others'] as const;
export const costLabels: Record<typeof costFields[number], string> = { fueling: 'Combustível', driverExpenses: 'Despesas do motorista', toll: 'Pedágio', thirdPartyFreight: 'Frete terceiro', seguro: 'Seguro', loadingUnloading: 'Carga e descarga', fines: 'Multas', others: 'Outros custos' };
export const cents = (value: number | undefined) => Math.round((value ?? 0) * 100);
export const tripCosts = (expense: Partial<Expense>) => costFields.reduce((sum, key) => sum + cents(expense[key]), 0) / 100;
export const sumMoney = <T,>(rows: T[], pick: (row: T) => number | undefined) => rows.reduce((sum, row) => sum + cents(pick(row)), 0) / 100;
export const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDateKey(date) === value;
}
export const displayDate = (value: string) => validDate(value) ? value.split('-').reverse().join('/') : 'Data inválida';
export type Period = 'daily' | 'weekly' | 'monthly' | 'all';
export function inPeriod(date: string, period: Period, reference = localDateKey()): boolean {
  if (!validDate(date) || !validDate(reference)) return false;
  if (period === 'all') return true;
  if (period === 'daily') return date === reference;
  if (period === 'monthly') return date.slice(0, 7) === reference.slice(0, 7);
  const start = new Date(`${reference}T12:00:00`);
  start.setDate(start.getDate() - 6);
  return date >= localDateKey(start) && date <= reference;
}
export function monthlyTotals(expenses: Expense[], period: 'six' | 'year' | 'all', now = new Date()) {
  const last = localDateKey(now).slice(0, 7);
  const first = period === 'year' ? `${now.getFullYear()}-01` : localDateKey(new Date(now.getFullYear(), now.getMonth() - 5, 1)).slice(0, 7);
  const buckets = new Map<string, { name: string; receita: number; despesa: number }>();
  if (period !== 'all') {
    const cursor = new Date(`${first}-01T12:00:00`);
    while (localDateKey(cursor).slice(0, 7) <= last) {
      const key = localDateKey(cursor).slice(0, 7);
      buckets.set(key, { name: key, receita: 0, despesa: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  for (const expense of expenses) {
    const key = expense.date.slice(0, 7);
    if (period !== 'all' && (key < first || key > last)) continue;
    const row = buckets.get(key) ?? { name: key, receita: 0, despesa: 0 };
    row.receita += cents(expense.freightValue);
    row.despesa += cents(tripCosts(expense));
    buckets.set(key, row);
  }
  return [...buckets.values()].sort((a, b) => a.name.localeCompare(b.name)).map(row => ({ ...row, receita: row.receita / 100, despesa: row.despesa / 100, name: `${row.name.slice(5)}/${row.name.slice(0, 4)}` }));
}
