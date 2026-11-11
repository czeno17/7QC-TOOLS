/**
 * Shared look-and-feel for every visx chart.
 * One place for fonts, colours, text sizes and small helpers so all
 * seven tools stay consistent (min 12px text, padded domains, 5-6 ticks).
 */

export const T = {
  sans: 'var(--font-plex-sans, "IBM Plex Sans", sans-serif)',
  mono: 'var(--font-plex-mono, "IBM Plex Mono", monospace)',
  axis: "#4a4a52",
  tick: "#a1a1aa",
  text: "#d4d4d8",
  fg: "#fafafa",
  accent: "#e5484d",
  accentFill: "rgba(229,72,77,0.78)",
  accentDim: "rgba(229,72,77,0.25)",
  warn: "#ffb224",
  grid: "rgba(255,255,255,0.07)",
  surface: "#0a0a0b",
  tickSize: 12,
  labelSize: 13,
} as const;

type TickExtra = {
  angle?: number;
  textAnchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
  fill?: string;
};

/** Tick label style: 12px Plex Sans with tabular numbers. */
export const tickLabelProps =
  (extra: TickExtra = {}) =>
  () => ({
    fill: T.tick,
    fontSize: T.tickSize,
    fontFamily: T.sans,
    style: { fontVariantNumeric: "tabular-nums" as const },
    ...extra,
  });

/** Axis title style: 13px. */
export const axisLabelProps = {
  fill: T.tick,
  fontSize: T.labelSize,
  fontFamily: T.sans,
  textAnchor: "middle" as const,
};

export const axisLine = { stroke: T.axis, tickStroke: T.axis } as const;

/** Pad a numeric domain so no point sits on the plot frame. */
export function padDomain(values: number[], pct = 0.06): [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  if (lo === hi) return [lo - 1, hi + 1];
  const pad = (hi - lo) * pct;
  return [lo - pad, hi + pad];
}

/** Integer-only ticks (for counts). */
export function intTicks(ticks: number[]): number[] {
  const ints = ticks.filter(value => Number.isInteger(value));
  return ints.length >= 2 ? ints : ticks;
}

export const fmt = (value: number, digits = 2) =>
  value.toLocaleString("en-US", { maximumFractionDigits: digits });

/** Number with a true minus sign (U+2212). */
export const signed = (value: number, digits: number) =>
  `${value < 0 ? "\u2212" : ""}${Math.abs(value).toFixed(digits)}`;

/** Light horizontal grid lines aligned to the y ticks. */
export function HGrid({
  ticks,
  width,
  y,
}: {
  ticks: number[];
  width: number;
  y: (value: number) => number;
}) {
  return (
    <>
      {ticks.map(tick => (
        <line key={tick} x1={0} x2={width} y1={y(tick)} y2={y(tick)} stroke={T.grid} />
      ))}
    </>
  );
}

/** Small SVG tooltip. Render it last inside the plot <Group>. */
export function SvgTip({
  x,
  y,
  lines,
  maxX,
}: {
  x: number;
  y: number;
  lines: string[];
  maxX: number;
}) {
  const width = Math.max(...lines.map(line => line.length)) * 7.4 + 18;
  const height = lines.length * 17 + 12;
  const left = Math.min(Math.max(x - width / 2, 0), Math.max(0, maxX - width));
  const top = y - height - 12 < -24 ? y + 14 : y - height - 12;
  return (
    <g pointerEvents="none" transform={`translate(${left} ${top})`}>
      <rect width={width} height={height} rx={6} fill="#18181b" stroke="#3f3f46" />
      {lines.map((line, index) => (
        <text
          key={index}
          x={9}
          y={19 + index * 17}
          fill={index === 0 ? T.fg : T.text}
          fontSize={12}
          fontFamily={T.sans}
          fontWeight={index === 0 ? 600 : 400}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}
