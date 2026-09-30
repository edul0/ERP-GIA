import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyData } from '../lib/data';
import { readLocalData, writeLocalData, DEMO_KEY } from '../lib/localData';
import { tripCosts, sumMoney, monthlyTotals, inPeriod, validDate } from '../lib/finance';
import { parseCSV, parseMoney, csvCell } from '../lib/csv';
import { validateExpense } from '../lib/validation';
import { DUMMY_EXPENSES, DUMMY_DRIVERS, DUMMY_TRUCKS, DUMMY_USERS } from '../constants';
import { buildReport } from '../lib/report';

test('usuário começa zerado, preserva veículos e mantém seus dados após salvar', () => {
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  const seed = { ...emptyData(), expenses: DUMMY_EXPENSES, drivers: DUMMY_DRIVERS, users: DUMMY_USERS, trucks: DUMMY_TRUCKS };
  const admin = DUMMY_USERS[0], user = DUMMY_USERS[1];
  const own = readLocalData(storage, seed, user);
  assert.equal(own.expenses.length, 0); assert.equal(own.drivers.length, 0); assert.equal(own.users.length, 0);
  assert.deepEqual(own.trucks, DUMMY_TRUCKS);
  own.drivers.push({ id: 'novo', name: 'Motorista novo' });
  own.expenses.push({ ...DUMMY_EXPENSES[0], id: 'nova', driverId: 'novo' });
  assert.equal(writeLocalData(storage, own, user), 1);
  assert.equal(readLocalData(storage, seed, user).expenses[0].id, 'nova');
  assert.equal(readLocalData(storage, seed, admin).expenses.length, 36);
  assert.equal(memory.has(DEMO_KEY), false);
  assert.equal(readLocalData(storage, seed, { ...user, id: 'outro' }).expenses.length, 0);
  assert.throws(() => writeLocalData(storage, own, user), /Outra aba/);
  assert.throws(() => writeLocalData(storage, own, { ...user, role: 'viewer' }), /consulta/);
});

test('totais incluem seguro e opcionais sem NaN nem erro de centavos', () => {
  assert.equal(sumMoney(DUMMY_EXPENSES, tripCosts), 39827.47);
  assert.equal(sumMoney(DUMMY_EXPENSES, expense => expense.freightValue), 123556);
  assert.equal(tripCosts({ seguro: 15, fueling: 20, others: 0.1, toll: 0.2 }), 35.3);
  const chart = monthlyTotals(DUMMY_EXPENSES, 'all');
  assert.equal(sumMoney(chart, row => row.receita), 123556);
  assert.equal(sumMoney(chart, row => row.despesa), 39827.47);
});

test('datas de calendário e janela semanal não aceitam datas futuras', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(inPeriod('2026-09-30', 'weekly', '2026-09-29'), false);
  assert.equal(inPeriod('2026-09-23', 'weekly', '2026-09-29'), true);
  assert.equal(inPeriod('2026-09-22', 'weekly', '2026-09-29'), false);
});

test('CSV trata vírgula decimal, aspas, separadores e fórmulas', () => {
  assert.equal(parseMoney('1.234,56'), 1234.56);
  assert.throws(() => parseMoney('12reais'));
  assert.deepEqual(parseCSV('a;b\r\n"São Paulo; SP";"a""b"'), [['a', 'b'], ['São Paulo; SP', 'a"b']]);
  assert.throws(() => parseCSV('"incompleto'));
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
});

test('formulário rejeita negativo, hodômetro invertido e motorista ausente', () => {
  assert.ok(validateExpense({ ...DUMMY_EXPENSES[0], fueling: -1 }, DUMMY_DRIVERS));
  assert.ok(validateExpense({ ...DUMMY_EXPENSES[0], exitOdometer: 1 }, DUMMY_DRIVERS));
  assert.ok(validateExpense({ ...DUMMY_EXPENSES[0], driverId: 'inexistente' }, DUMMY_DRIVERS));
});

test('relatório grande pagina sem perder a última linha', () => {
  const pdf = buildReport({ title: 'Teste de paginação', subtitle: '100 linhas', columns: ['Item', 'Descrição'], widths: [30, 243], rows: Array.from({ length: 100 }, (_, i) => [String(i), `Registro ${i}`]), summary: [['Registros', '100']] });
  assert.ok(pdf.getNumberOfPages() >= 4);
  assert.match(pdf.output(), /Registro 99/);
});
