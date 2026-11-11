import { z } from 'zod';

export const ParetoInputSchema = z.string().transform((val, ctx) => {
  const lines = val.split('\n').map(s => s.trim()).filter(Boolean);
  const items = lines.map(line => {
    const m = line.match(/^(.+?)[:,]\s*(-?\d+(\.\d+)?)$/);
    return m ? { name: m[1].trim(), value: parseFloat(m[2]) } : null;
  }).filter((item): item is { name: string; value: number } => item !== null);

  if (items.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No valid data points found' });
    return z.NEVER;
  }
  return items;
});

export type ParetoItem = { name: string; value: number };
export type ParetoResult = {
  items: ParetoItem[];
  cumPct: number[];
  idx80: number;
  total: number;
  interpretation: string;
};

export { computePareto } from "@/lib/stats/pareto";
