export const linearRegression = (data: { x: number; y: number }[]) => {
  const n = data.length;
  if (!n) return { slope: 0, intercept: 0 };
  const meanX = data.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = data.reduce((sum, point) => sum + point.y, 0) / n;
  const numerator = data.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const denominator = data.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
};
