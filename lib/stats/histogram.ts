import { formatStat, mean, stdDev } from "@/lib/stats/descriptive";
import { Cp, Cpk } from "@/lib/stats/capability";

export const getBins = (data: number[], binCount = Math.max(5, Math.min(14, Math.round(Math.sqrt(data.length))))) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const binWidth = range / binCount || 1;
  const bins = new Array(binCount).fill(0).map((_, i) => ({
    min: min + i * binWidth,
    max: min + (i + 1) * binWidth,
    count: 0
  }));
  
  data.forEach(val => {
    let index = Math.floor((val - min) / binWidth);
    if (index === binCount) index--;
    index = Math.max(0, Math.min(binCount - 1, index));
    bins[index].count++;
  });
  
  return bins;
};

export function computeHistogram(data: number[], lsl?: number, usl?: number) {
  const avg = mean(data);
  const sigma = stdDev(data);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const bins = getBins(data);
  const binWidth = bins[0]?.max - bins[0]?.min || 1;
  const maxBin = Math.max(...bins.map(bin => bin.count));
  const yMax = Math.ceil(maxBin * 1.15);
  const curve = sigma > 0
    ? Array.from({ length: 61 }, (_, index) => {
      const x = avg - 4 * sigma + (8 * sigma * index) / 60;
      const pdf = Math.exp(-0.5 * ((x - avg) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
      return { x, y: pdf * data.length * binWidth };
    })
    : [];
  const hasSpecs = lsl !== undefined && usl !== undefined;
  const cp = hasSpecs && sigma > 0 ? Cp(usl, lsl, sigma) : null;
  const cpk = hasSpecs && sigma > 0 ? Cpk(usl, lsl, avg, sigma) : null;
  const capText = cpk === null
    ? ""
    : cpk >= 1.33
      ? ` Cpk of ${formatStat(cpk, 2)} — process is capable relative to spec limits.`
      : cpk >= 1
        ? ` Cpk of ${formatStat(cpk, 2)} — process is marginally capable; consider tightening variation.`
        : ` Cpk of ${formatStat(cpk, 2)} — process is not capable of consistently meeting spec.`;
  const skewNote = Math.abs(avg - (min + max) / 2) > sigma * 0.5
    ? " Distribution appears skewed rather than centered."
    : " Distribution appears roughly centered.";

  return {
    bins,
    curve,
    stats: { mean: avg, stdDev: sigma, n: data.length, min, max, range: max - min, cp, cpk },
    yMax,
    binWidth,
    interpretation: `Mean = ${formatStat(avg, 3)}, Std Dev = ${formatStat(sigma, 3)} across ${data.length} readings.${skewNote}${capText}`,
  };
}
