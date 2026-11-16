import {test} from 'node:test';
import assert from 'node:assert/strict';
import {companyNames,companyProfiles} from '../lib/companyNames';
import {DUMMY_EXPENSES} from '../constants';
test('firmas das duas frotas viram sugestões sem duplicar nomes ou alterar registros',()=>{
 const rows=[{...DUMMY_EXPENSES[0],type:'internal' as const,clientName:' Canelas ',saleSheet:undefined},{...DUMMY_EXPENSES[0],type:'external' as const,clientName:'CANELAS',saleSheet:undefined},{...DUMMY_EXPENSES[0],clientName:'Refricon',saleSheet:undefined}];
 const original=JSON.stringify(rows);
 assert.deepEqual(companyNames(rows),['Canelas','Refricon']);
 assert.equal(JSON.stringify(rows),original);
 assert.deepEqual(companyNames([]),[]);
});
test('a primeira cidade cadastrada para uma firma vira a sugestão das próximas fichas',()=>{
 const older={...DUMMY_EXPENSES[0],date:'2026-01-10',saleSheet:{...DUMMY_EXPENSES[0].saleSheet!,company:'Pague Menos',city:'Sorocaba',state:'SP'}};
 const newer={...older,date:'2026-02-10',saleSheet:{...older.saleSheet,city:'Outra cidade'}};
 const profiles=companyProfiles([newer,older]);
 assert.deepEqual(profiles['pague menos'],{name:'Pague Menos',city:'Sorocaba',state:'SP'});
});
