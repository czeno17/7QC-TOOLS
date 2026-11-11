import { z } from "zod";

export const ScatterInputSchema = z.string().transform((value) => {
  return value.split("\n").map(line => {
    const numbers = line.trim().split(/[,\s]+/).map(Number).filter(number => !Number.isNaN(number));
    return numbers.length >= 2 ? { x: numbers[0], y: numbers[1] } : null;
  }).filter((point): point is { x: number; y: number } => point !== null);
});
