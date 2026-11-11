export const Cp = (USL: number, LSL: number, sigma: number) => (USL - LSL) / (6 * sigma);
export const Cpk = (USL: number, LSL: number, mean: number, sigma: number) =>
  Math.min((USL - mean) / (3 * sigma), (mean - LSL) / (3 * sigma));
