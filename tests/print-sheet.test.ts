import {test} from 'node:test';
import assert from 'node:assert/strict';
import {saleSheetReport} from '../lib/report';
import {emptySaleSheet} from '../lib/saleSheet';
test('ficha A4 cabe em uma página e observações longas continuam sem perder o final',async()=>{
 const data={invoice:'3650',date:'2026-10-13',entryOdometer:1000,exitOdometer:1450,saleSheet:{...emptySaleSheet(),totalBoxes:690,notes:'Observação curta'}};
 const short=await saleSheetReport(data,'Motorista');assert.equal(short.getNumberOfPages(),1);
 const long=await saleSheetReport({...data,saleSheet:{...data.saleSheet,notes:'Informação registrada. '.repeat(1500)+'FIM-DA-OBSERVACAO'}},'Motorista');
 assert.ok(long.getNumberOfPages()>1);assert.ok(long.output().includes('FIM-DA-OBSERVACAO'));
});
