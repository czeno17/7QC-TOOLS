import type { StratificationGroup } from "@/lib/stats/stratification";

export function computeStratification(data: string): StratificationGroup[] {
  const groups: StratificationGroup[] = [];
  for (const line of data.split("\n").map(value => value.trim()).filter(Boolean)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const name = line.slice(0, separator).trim();
    const values = line.slice(separator + 1)
      .split(/[\s,;]+/)
      .map(value => value.trim())
      .filter(Boolean)
      .map(Number)
      .filter(value => !Number.isNaN(value));
    if (values.length) groups.push({ name, values });
  }
  return groups;
}
