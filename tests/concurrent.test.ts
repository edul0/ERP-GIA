import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeCompanyData} from '../lib/concurrent';
import {emptyData} from '../lib/data';
import {filterFleet} from '../lib/fleetFilters';
import {DUMMY_EXPENSES} from '../constants';
test('conciliação preserva cadastros simultâneos e rejeita alterações concorrentes no mesmo registro',()=>{
 const base={...emptyData(),drivers:[{id:'1',name:'A'}]};
 const local={...base,drivers:[{id:'1',name:'B'}]};
 const remote={...base,revision:2,drivers:[...base.drivers,{id:'2',name:'C'}]};
 assert.deepEqual(mergeCompanyData(base,local,remote).drivers,[{id:'1',name:'B'},{id:'2',name:'C'}]);
 assert.throws(()=>mergeCompanyData(base,local,{...base,drivers:[{id:'1',name:'D'}]}),/mesmo registro/);
 assert.equal(mergeCompanyData(base,{...base,drivers:[]},remote).drivers.length,1);
});
test('busca por NF e motorista combina período e placa sem modificar a base',()=>{
 const expense={...DUMMY_EXPENSES[0],invoice:'3650',date:'2026-10-01',licensePlate:'ABC1234',driverId:'d'};
 const filters={query:'adenilson',driver:'d',plate:'ABC1234',from:'2026-10-01',to:'2026-10-31'};
 assert.equal(filterFleet([expense],[{id:'d',name:'Adénilson'}],filters).length,1);
 assert.equal(filterFleet([expense],[],{...filters,query:'3650',to:'2026-09-30'}).length,0);
});
