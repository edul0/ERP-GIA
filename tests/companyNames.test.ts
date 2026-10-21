import {test} from 'node:test';
import assert from 'node:assert/strict';
import {companyNames} from '../lib/companyNames';
import {DUMMY_EXPENSES} from '../constants';
test('firmas das duas frotas viram sugestões sem duplicar nomes ou alterar registros',()=>{
 const rows=[{...DUMMY_EXPENSES[0],type:'internal' as const,clientName:' Canelas ',saleSheet:undefined},{...DUMMY_EXPENSES[0],type:'external' as const,clientName:'CANELAS',saleSheet:undefined},{...DUMMY_EXPENSES[0],clientName:'Refricon',saleSheet:undefined}];
 const original=JSON.stringify(rows);
 assert.deepEqual(companyNames(rows),['Canelas','Refricon']);
 assert.equal(JSON.stringify(rows),original);
 assert.deepEqual(companyNames([]),[]);
});
