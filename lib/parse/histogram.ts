import { z } from 'zod';

export const HistogramInputSchema = z.string().transform((val, ctx) => {
  const nums = val.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean).map(Number);
  const valid = nums.filter(n => !isNaN(n));
  
  if (valid.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No valid numbers found' });
    return z.NEVER;
  }
  return valid;
});
