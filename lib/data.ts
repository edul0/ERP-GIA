import { z } from 'zod';
import { validDate } from './finance';
import { validateExpense } from './validation';
import type { Driver, DriverTracking, Expense, MaintenanceRecord, Truck, User } from '../types';
const number = z.number().finite().nonnegative();
const date = z.string().refine(validDate, 'Data inválida');
const text = z.string().trim().min(1);
export const roleSchema = z.enum(['admin', 'user', 'finance', 'viewer', 'mechanic']);
const expenseSchema = z.object({
 id: text, date, driverId: text, licensePlate: text, destination: text, type: z.enum(['internal', 'external']), freightValue: number,
 invoice: z.string().default(''), fueling: number.default(0), toll: number.default(0), seguro: number.default(0), thirdPartyFreight: number.default(0), driverExpenses: number.default(0),
 loadingUnloading: number.default(0), fines: number.default(0), others: number.default(0), entryOdometer: number.default(0), exitOdometer: number.default(0),
 clientName: z.string().optional(), receiptImage: z.string().optional(), ciot: z.string().optional(), mdfe: z.string().optional()
}).refine(value => validateExpense(value) === null, 'Lançamento inválido');
const location = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), timestamp: text, speed: number });
const schema = z.object({
 expenses: z.array(expenseSchema), drivers: z.array(z.object({ id: text, name: text })),
 users: z.array(z.object({ id: text, username: text, role: roleSchema, password: z.string().optional(), profilePicture: z.string().optional() })).default([]),
 trucks: z.array(z.object({ id: text, plate: text, model: text, year: z.number().int().min(1900).max(2200), status: z.enum(['active', 'maintenance', 'idle']), lastOdometer: number, nextMaintenanceOdometer: number.optional() })).default([]),
 maintenance: z.array(z.object({ id: text, truckId: text, date, type: z.enum(['tire', 'oil', 'preventive', 'corrective']), description: text, cost: number, odometer: number, status: z.enum(['pending', 'completed']) })).default([]),
 trackingData: z.array(z.object({ driverId: text, driverName: text, lastUpdate: text, currentLocation: location, routeHistory: z.array(location), pendingCargos: z.array(z.object({ id: text, description: text, destination: text, lat: z.number(), lng: z.number(), priority: z.enum(['low', 'medium', 'high']), deadline: text, value: number })) })).default([]),
 revision: z.number().int().nonnegative().default(0)
});
export interface UserData { expenses: Expense[]; drivers: Driver[]; users: User[]; trucks: Truck[]; maintenance: MaintenanceRecord[]; trackingData: DriverTracking[]; revision: number; }
export const emptyData = (): UserData => ({ expenses: [], drivers: [], users: [], trucks: [], maintenance: [], trackingData: [], revision: 0 });
export function parseData(input: unknown): UserData {
 const result = schema.safeParse(input);
 if (!result.success) throw new Error('A base contém dados inválidos. Nenhum registro foi substituído. Revise a base com o administrador.');
 const data = result.data;
 for (const records of [data.expenses, data.drivers, data.trucks, data.maintenance, data.users]) {
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('A base contém identificadores duplicados.');
 }
 if (data.expenses.some(expense => !data.drivers.some(driver => driver.id === expense.driverId))) throw new Error('Há lançamentos associados a motoristas inexistentes.');
 if (data.maintenance.some(record => !data.trucks.some(truck => truck.id === record.truckId))) throw new Error('Há manutenções associadas a veículos inexistentes.');
 return data as UserData;
}
