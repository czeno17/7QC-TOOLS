export const getBoxPlotStats = (data: number[]) => {
  const sorted = [...data].sort((a, b) => a - b);
  const quantile = (p: number) => {
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  };
  const q1 = quantile(0.25);
  const median = quantile(0.5);
  const q3 = quantile(0.75);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { min, q1, median, q3, max };
};
