import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canManageMaintenance} from '../lib/permissions';
test('Dena tem a mesma permissão de manutenção do Marcio, mantendo restrições dos demais perfis',()=>{
 for(const username of ['marcio','dena','Dena'])assert.equal(canManageMaintenance({username,role:'user'}),true);
 for(const role of ['admin','mechanic'])assert.equal(canManageMaintenance({username:'outro',role}),true);
 for(const role of ['user','viewer','finance'])assert.equal(canManageMaintenance({username:'outro',role}),false);
 assert.equal(readFileSync('lib/permissions.ts','utf8'),readFileSync('supabase/functions/gia-api/lib/permissions.ts','utf8'));
});
