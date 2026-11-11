export const mean = (vals: number[]) => {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

export const stdDev = (data: number[]) => {
  if (data.length < 2) return 0;
  const avg = mean(data);
  return Math.sqrt(data.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (data.length - 1));
};

export const formatStat = (value: number, digits = 3) => {
  const scale = 10 ** digits;
  return (Math.round(value * scale) / scale).toString();
};
