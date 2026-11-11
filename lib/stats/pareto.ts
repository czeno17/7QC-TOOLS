export function computePareto(items: { name: string; value: number }[]) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((a, i) => a + i.value, 0);
  let cum = 0;
  const cumPct = sorted.map((it) => {
    cum += it.value;
    return total === 0 ? 0 : Math.round((cum / total) * 1000) / 10;
  });
  let idx80 = cumPct.findIndex(pct => pct >= 80);
  if (idx80 === -1) idx80 = sorted.length - 1;
  const vitalFew = sorted.slice(0, idx80 + 1);
  const interpretation = cumPct.some(pct => pct >= 80)
    ? `${vitalFew.length} of ${sorted.length} categories (${vitalFew.map(item => item.name).join(", ")}) account for ${cumPct[idx80]}% of total occurrences — the vital few. Focus corrective action here first for maximum impact.`
    : `Contributions are relatively evenly spread across all ${sorted.length} categories — no small subset dominates.`;
  return { items: sorted, cumPct, idx80, total, interpretation };
}
