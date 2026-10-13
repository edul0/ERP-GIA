import {test} from 'node:test';
import assert from 'node:assert/strict';
import {distanceTraveled} from '../lib/finance';
test('quilometragem calcula chegada menos saída sem valores financeiros',()=>{
 assert.equal(distanceTraveled({entryOdometer:1000,exitOdometer:1500}),500);
 assert.equal(distanceTraveled({entryOdometer:1500,exitOdometer:1500}),0);
 assert.equal(distanceTraveled({}),0);
});
