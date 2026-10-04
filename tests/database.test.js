const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeText, calculateIssueOccurrenceCount, buildOccurrenceHistory } = require('../src/database');

test('normalizeText keeps a stable value for equipment and problem matching', () => {
  const normalized = normalizeText('Fresh Water Pump — Low Water Flow!');

  assert.equal(normalized, 'fresh water pump low water flow');
});

test('calculateIssueOccurrenceCount matches the same equipment and issue across records', () => {
  const records = [
    { equipmentAffected: 'Fresh Water Pump', problem: 'Low Water Flow' },
    { equipmentAffected: 'Fresh Water Pump', problem: 'Low Water Flow' },
    { equipmentAffected: 'Fresh Water Pump', problem: 'Low Water Flow' },
    { equipmentAffected: 'Fresh Water Pump', problem: 'High Temperature' },
  ];

  const count = calculateIssueOccurrenceCount(records, 'Fresh Water Pump', 'Low Water Flow');

  assert.equal(count, 3);
});

test('buildOccurrenceHistory groups all matching occurrences for the same equipment and issue', () => {
  const records = [
    { id: 1, date: '2026-09-12', equipmentAffected: 'Fresh Water Pump', problem: 'Low Water Flow', observation: 'Observation 1', rootCause: 'Root 1', correctiveActivity: 'Fix 1' },
    { id: 2, date: '2026-09-10', equipmentAffected: 'Fresh Water Pump', problem: 'Low Water Flow', observation: 'Observation 2', rootCause: 'Root 2', correctiveActivity: 'Fix 2' },
    { id: 3, date: '2026-09-08', equipmentAffected: 'Generator', problem: 'Low Water Flow', observation: 'Different equipment', rootCause: 'Root 3', correctiveActivity: 'Fix 3' },
  ];

  const history = buildOccurrenceHistory(records, 'Fresh Water Pump', 'Low Water Flow');

  assert.equal(history.length, 2);
  assert.deepEqual(history.map((record) => record.id), [1, 2]);
});
