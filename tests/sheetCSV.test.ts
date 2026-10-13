import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sheetCSVRows,importSheetCSV} from '../lib/sheetCSV';
import {csvCell} from '../lib/csv';
import {emptySaleSheet,saleTotals} from '../lib/saleSheet';
import {DUMMY_EXPENSES} from '../constants';
const drivers=[{id:'d',name:'José da Silva'}];
const expense={...DUMMY_EXPENSES[0],date:'2026-09-19',driverId:'d',invoice:'3650',seguro:448.5,freightValue:5520,saleSheet:{...emptySaleSheet(),company:'Firma; São Paulo',saleNumber:'10',driverCity:'Monte Mor',driverState:'SP',notes:'Primeira linha\n"Observação"',freightPerBox:8,products:Array.from({length:5},(_,i)=>({id:String(i),species:'Tomate '+i,quantity:i+1,unitPrice:120.5})),discounts:[{id:'q',species:'Quebra',quantity:2,unitPrice:20.25},{id:'d',species:'Desconto',quantity:1,unitPrice:10}]}};
const text=(rows:unknown[][])=>'\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
test('CSV da ficha preserva produtos, descontos, acentos, aspas e valores em ida e volta',()=>{
 const rows=sheetCSVRows([expense],drivers);const imported=importSheetCSV(text(rows),drivers,'external')[0];
 assert.equal(imported.type,'external');assert.equal(imported.driverId,'d');assert.equal(imported.seguro,448.5);
 assert.equal(imported.saleSheet?.company,expense.saleSheet.company);assert.equal(imported.saleSheet?.notes,expense.saleSheet.notes);
 assert.equal(imported.saleSheet?.products.length,0);assert.equal(imported.saleSheet?.totalBoxes,15);assert.equal(imported.saleSheet?.brokenBoxes,0);
 assert.equal(saleTotals(imported.saleSheet!).boxes,saleTotals(expense.saleSheet).boxes);
 assert.ok(!rows[0].some(value=>String(value).startsWith('Espécie')));assert.ok(rows[0].includes('Abastecimento'));assert.ok(!rows[0].includes('Valor da NF'));assert.ok(!rows[0].includes('Prazo pag.'));assert.equal(rows[0][0],'Nº NF');assert.ok(!rows[0].includes('ID_Motorista'));
});
test('importação aceita data brasileira e rejeita motorista desconhecido e colunas antigas',()=>{
 const rows=sheetCSVRows([expense],drivers);rows[1][0]='19/09/2026';
 assert.equal(importSheetCSV(text(rows),drivers,'internal')[0].date,'2026-09-19');
 assert.throws(()=>importSheetCSV(text(rows),[],'internal'),/Linha 2.*motorista/);
 assert.throws(()=>importSheetCSV('Data;ID_Motorista\n2026-09-19;d',drivers,'internal'),/modelo CSV/);
});
