import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySaleSheet, saleTotals } from '../lib/saleSheet';
import { parseData, emptyData } from '../lib/data';
import {validateExpense} from '../lib/validation';
test('ficha em papel não exige rota e valida valores sem alterar custos históricos', () => {
 const data=emptyData();data.drivers=[{id:'d',name:'Motorista'}];
 const expense={id:'paper',date:'2026-09-19',driverId:'d',licensePlate:'GET0I46',destination:'',type:'internal' as const,freightValue:5520,seguro:448.5,fueling:27,thirdPartyFreight:0,toll:0,driverExpenses:0,entryOdometer:0,exitOdometer:0,invoice:'3650',saleSheet:emptySaleSheet()};
 assert.equal(validateExpense(expense,data.drivers),null);
 data.expenses=[expense];assert.equal(parseData(data).expenses[0].fueling,27);
 expense.saleSheet.products=[{id:'p',species:'Livre',quantity:-1,unitPrice:120}];
 assert.ok(validateExpense(expense,data.drivers));
});
test('ficha calcula caixas, descontos e centavos sem espécies predefinidas', () => {
 const sheet = { ...emptySaleSheet(), products: [{ id: 'a', species: 'Tomate personalizado', quantity: 410, unitPrice: 120 }, { id: 'b', species: 'Livre', quantity: 153, unitPrice: 60 }, { id: 'c', species: 'Outra espécie', quantity: 110, unitPrice: 20 }], discounts: [{ id: 'd', species: 'Quebra', quantity: 17, unitPrice: 2.5 }], freightPerBox: 8 };
 assert.deepEqual(saleTotals(sheet), { boxes: 673, gross: 60580, discounts: 42.5, payable: 60537.5, freight: 5384 });
});
test('campos da ficha sobrevivem à validação e registros antigos continuam válidos', () => {
 const data = emptyData(); data.drivers = [{ id: 'd', name: 'Motorista' }];
 data.expenses = [{ id: 'e', date: '2026-09-19', driverId: 'd', freightValue: 100, licensePlate: 'GET0I46', destination: 'Destino', thirdPartyFreight: 0, seguro: 0, invoice: '', fueling: 0, entryOdometer: 0, exitOdometer: 0, driverExpenses: 0, toll: 0, type: 'internal', saleSheet: { ...emptySaleSheet(), paymentTerms: '45 dias', notes: 'Observação livre' } }];
 assert.equal(parseData(JSON.parse(JSON.stringify(data))).expenses[0].saleSheet?.paymentTerms, '45 dias');
 delete data.expenses[0].saleSheet;
 assert.equal(parseData(data).expenses.length, 1);
});
