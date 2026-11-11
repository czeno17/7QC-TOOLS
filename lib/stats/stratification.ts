import { getBoxPlotStats } from "@/lib/stats/boxplot";
import { formatStat, mean, stdDev } from "@/lib/stats/descriptive";

export type StratificationGroup = {
  name: string;
  values: number[];
};

export function summarizeStratification(groups: StratificationGroup[]) {
  const summaries = groups.map(group => ({
    ...group,
    summary: getBoxPlotStats(group.values),
    mean: mean(group.values),
    sd: group.values.length > 1 ? stdDev(group.values) : 0,
  }));
  const best = summaries.slice().sort((a, b) => a.mean - b.mean)[0];
  const worst = summaries.slice().sort((a, b) => b.mean - a.mean)[0];
  const mostVar = summaries.slice().sort((a, b) => b.sd - a.sd)[0];
  const interpretation = best && worst && mostVar
    ? `${worst.name} shows the highest mean (${formatStat(worst.mean, 3)}); ${best.name} the lowest (${formatStat(best.mean, 3)}) — a spread of ${formatStat(worst.mean - best.mean, 3)}. ${mostVar.name} has the widest spread (Std Dev ${formatStat(mostVar.sd, 3)}), making it the least consistent segment worth investigating first.`
    : "";
  return { groups: summaries, interpretation };
}
