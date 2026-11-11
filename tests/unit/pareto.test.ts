import { expect, test } from 'vitest';
import { computePareto } from '../../lib/stats/pareto';

test('pareto computes correctly', () => {
  const items = [
    { name: 'A', value: 10 },
    { name: 'B', value: 20 },
    { name: 'C', value: 30 },
  ];
  const res = computePareto(items);
  expect(res.total).toBe(60);
  expect(res.items[0].name).toBe('C');
  expect(res.cumPct[0]).toBeCloseTo(50, 1);
  expect(res.cumPct[1]).toBeCloseTo(83.3, 1);
  expect(res.idx80).toBe(1);
});
