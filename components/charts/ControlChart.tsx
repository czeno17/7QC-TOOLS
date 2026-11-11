"use client";

import { useState } from "react";
import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Circle, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { SvgTip, T, axisLine, fmt, padDomain, tickLabelProps } from "./chart-theme";

type Props = {
  data: number[];
  ucl: number;
  lcl: number;
  cl: number;
  label: string;
  flagged?: boolean[];
};

export default function ControlChart({ data, ucl, lcl, cl, label, flagged = [] }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [yLow, yHigh] = padDomain([ucl, lcl, ...data], 0.08);
  const sigma = (ucl - cl) / 3;
  const flaggedCount = flagged.filter(Boolean).length;
  const last = Math.max(1, data.length - 1);
  const step = Math.max(1, Math.ceil(data.length / 10));
  const xTicks = data.map((_, index) => index).filter(index => index % step === 0);

  return (
    <div className="h-[340px] w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 34, right: 92, bottom: 40, left: 60 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleLinear({ domain: [-0.4, last + 0.4], range: [0, innerWidth] });
          const yScale = scaleLinear({ domain: [yLow, yHigh], range: [innerHeight, 0], nice: true });
          const yTicks = yScale.ticks(5);
          const points = data.map((value, index) => ({ x: index, y: value }));

          const band = (from: number, to: number, fill: string) => {
            const top = yScale(Math.max(from, to));
            const bottom = yScale(Math.min(from, to));
            return <rect x={0} y={top} width={innerWidth} height={Math.max(0, bottom - top)} fill={fill} />;
          };

          const limits = [
            { name: "UCL", value: ucl, color: T.accent, dash: "6 4" },
            { name: "CL", value: cl, color: T.tick, dash: "2 4" },
            { name: "LCL", value: lcl, color: T.accent, dash: "6 4" },
          ];

          return (
            <svg width={width} height={height} role="img" aria-label={`${label} control chart, ${flaggedCount} out-of-control signals`}>
              <Group top={margin.top} left={margin.left}>
                {sigma > 0 && (
                  <>
                    {band(cl + 2 * sigma, cl + 3 * sigma, "rgba(229,72,77,0.10)")}
                    {band(cl - 3 * sigma, cl - 2 * sigma, "rgba(229,72,77,0.10)")}
                    {band(cl + sigma, cl + 2 * sigma, "rgba(255,178,36,0.07)")}
                    {band(cl - 2 * sigma, cl - sigma, "rgba(255,178,36,0.07)")}
                  </>
                )}
                {yTicks.map(tick => (
                  <line key={tick} x1={0} x2={innerWidth} y1={yScale(tick)} y2={yScale(tick)} stroke={T.grid} />
                ))}
                {limits.map(limit => (
                  <g key={limit.name}>
                    <line
                      x1={0}
                      x2={innerWidth}
                      y1={yScale(limit.value)}
                      y2={yScale(limit.value)}
                      stroke={limit.color}
                      strokeWidth={1.5}
                      strokeDasharray={limit.dash}
                    />
                    <text
                      x={innerWidth + 8}
                      y={yScale(limit.value)}
                      dy={4}
                      fill={limit.color}
                      fontSize={12}
                      fontFamily={T.mono}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {`${limit.name} ${fmt(limit.value, 3)}`}
                    </text>
                  </g>
                ))}
                <LinePath
                  data={points}
                  x={point => xScale(point.x)}
                  y={point => yScale(point.y)}
                  stroke={T.tick}
                  strokeWidth={1.5}
                />
                {points.map(point => {
                  const isFlagged = Boolean(flagged[point.x]);
                  return (
                    <g key={point.x}>
                      {isFlagged && (
                        <Circle cx={xScale(point.x)} cy={yScale(point.y)} r={9} fill="none" stroke={T.accent} strokeWidth={1.5} />
                      )}
                      <Circle
                        cx={xScale(point.x)}
                        cy={yScale(point.y)}
                        r={hover === point.x ? 6 : 4.5}
                        fill={isFlagged ? T.accent : T.fg}
                        stroke={T.surface}
                      />
                      <Circle
                        cx={xScale(point.x)}
                        cy={yScale(point.y)}
                        r={11}
                        fill="transparent"
                        onMouseEnter={() => setHover(point.x)}
                        onMouseLeave={() => setHover(null)}
                      />
                    </g>
                  );
                })}
                <text x={0} y={-14} fill={T.text} fontSize={13} fontWeight={600} fontFamily={T.sans}>
                  {label}
                </text>
                {flaggedCount > 0 && (
                  <text x={innerWidth} y={-14} textAnchor="end" fill={T.accent} fontSize={12} fontFamily={T.sans}>
                    {`${flaggedCount} out-of-control ${flaggedCount === 1 ? "signal" : "signals"}`}
                  </text>
                )}
                <AxisLeft
                  scale={yScale}
                  tickValues={yTicks}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "end", dx: -4, dy: 4 })}
                />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  tickValues={xTicks}
                  tickFormat={value => `SG${Number(value) + 1}`}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "middle" })}
                />
                {hover !== null && data[hover] !== undefined && (
                  <SvgTip
                    x={xScale(hover)}
                    y={yScale(data[hover])}
                    maxX={innerWidth}
                    lines={[
                      `Subgroup ${hover + 1}`,
                      `${label}: ${fmt(data[hover], 3)}`,
                      ...(flagged[hover] ? ["Out-of-control signal"] : []),
                    ]}
                  />
                )}
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
