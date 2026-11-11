import { formatStat } from "@/lib/stats/descriptive";

export const computeCheckSheet = (types: string[], data: string[]) => {
  const tally: Record<string, number> = {};
  types.forEach(type => {
    if (type.trim() && !Object.hasOwn(tally, type.trim())) tally[type.trim()] = 0;
  });

  let unmatched = 0;
  data.forEach(obs => {
    const trimmed = obs.trim();
    const hit = Object.keys(tally).find(type => type.toLowerCase() === trimmed.toLowerCase());
    if (hit) tally[hit]++;
    else unmatched++;
  });

  const definedTypes = Object.keys(tally);
  const values = definedTypes.map(type => tally[type]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const top = definedTypes.slice().sort((a, b) => tally[b] - tally[a])[0];
  const interpretation = top
    ? `${total} defect(s) logged across ${definedTypes.length} type(s). ${top} is the most frequent at ${tally[top]} occurrence(s) (${total ? formatStat((tally[top] / total) * 100, 1) : "0"}% of total)${unmatched ? `. ${unmatched} entr${unmatched === 1 ? "y" : "ies"} did not match a defined type.` : "."}`
    : "";
  return { types: definedTypes, tally, total, unmatched, interpretation };
};
