import type { Driver, Expense, MaintenanceRecord, Truck } from '../types';
import { costFields, validDate } from './finance';

export function validateExpense(expense: Partial<Expense>, drivers?: Driver[]): string | null {
  if (!validDate(expense.date)) return 'Informe uma data válida.';
  if (!expense.driverId || (drivers && !drivers.some(driver => driver.id === expense.driverId))) return 'Selecione um motorista cadastrado.';
  if (!expense.licensePlate?.trim() || !expense.destination?.trim()) return 'Preencha a placa e o destino.';
  if (!['internal', 'external'].includes(expense.type)) return 'Tipo de frota inválido.';
  for (const key of ['freightValue', ...costFields, 'entryOdometer', 'exitOdometer'] as const) {
    const value = expense[key];
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) return 'Valores e hodômetros devem ser números positivos ou zero.';
  }
  if (typeof expense.freightValue !== 'number') return 'Informe o valor do frete.';
  if ((expense.exitOdometer ?? 0) < (expense.entryOdometer ?? 0)) return 'O hodômetro final não pode ser menor que o inicial.';
  return null;
}
export function normalizeExpense(expense: Partial<Expense>): Expense {
  return { ...Object.fromEntries([...costFields, 'entryOdometer', 'exitOdometer'].map(key => [key, expense[key] ?? 0])), ...expense,
    licensePlate: expense.licensePlate.trim().toUpperCase(), destination: expense.destination.trim(), invoice: expense.invoice ?? '' } as Expense;
}
export function validateMaintenance(record: Partial<MaintenanceRecord>, trucks: Truck[]): string | null {
  if (!trucks.some(truck => truck.id === record.truckId)) return 'Selecione um veículo cadastrado.';
  if (!validDate(record.date) || !record.description?.trim()) return 'Preencha a data e a descrição da manutenção.';
  if (!['tire', 'oil', 'preventive', 'corrective'].includes(record.type) || !['pending', 'completed'].includes(record.status)) return 'Tipo ou status de manutenção inválido.';
  if (![record.cost, record.odometer].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) return 'Custo e hodômetro devem ser positivos ou zero.';
  return null;
}
