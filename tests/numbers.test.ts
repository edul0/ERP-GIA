import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDecimal, parseDecimal } from '../lib/numbers.ts';

test('accepts Brazilian decimal values with comma', () => {
  assert.equal(parseDecimal('8,50'), 8.5);
  assert.equal(parseDecimal('1.234,56'), 1234.56);
  assert.equal(parseDecimal('8.5'), 8.5);
});

test('formats decimals using a comma without grouping', () => {
  assert.equal(formatDecimal(8.5), '8,5');
  assert.equal(formatDecimal(1234.56), '1234,56');
});
