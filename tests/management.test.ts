import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sheetIssues,managementSummary} from '../lib/management';
import {emptySaleSheet} from '../lib/saleSheet';
import {DUMMY_EXPENSES} from '../constants';
test('gestão soma somente fichas e sinaliza divergências sem alterar os dados',()=>{
 const expense={...DUMMY_EXPENSES[0],invoice:'3650',freightValue:80,saleSheet:{...emptySaleSheet(),company:'Firma',invoiceValue:100,freightPerBox:8,products:[{id:'p',species:'Livre',quantity:10,unitPrice:10}]}};
 assert.deepEqual(sheetIssues(expense),[]);
 const summary=managementSummary([expense,DUMMY_EXPENSES[1]]);
 assert.equal(summary.sheets.length,1);assert.equal(summary.boxes,10);assert.equal(summary.payable,100);assert.equal(summary.freight,80);
 const mismatch={...expense,saleSheet:{...expense.saleSheet,invoiceValue:90}};
 assert.ok(sheetIssues(mismatch).includes('Conferir NF e total dos produtos'));assert.equal(mismatch.saleSheet.invoiceValue,90);
});
