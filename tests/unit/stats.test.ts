import { expect, test } from 'vitest';
import { mean, stdDev } from '../../lib/stats/descriptive';
import { Cp, Cpk } from '../../lib/stats/capability';

test('descriptive stats', () => {
  const data = [1, 2, 3, 4, 5];
  expect(mean(data)).toBe(3);
  expect(stdDev(data)).toBeCloseTo(1.581, 3);
});

test('capability stats', () => {
  expect(Cp(10, 0, 1)).toBeCloseTo(1.667, 3);
  expect(Cpk(10, 0, 5, 1)).toBeCloseTo(1.667, 3);
});
