"use client";

import { useState } from "react";
import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { summarizeStratification } from "@/lib/stats/stratification";
import { HGrid, SvgTip, T, axisLine, fmt, padDomain, tickLabelProps } from "./chart-theme";

type Summary = ReturnType<typeof summarizeStratification>["groups"][number];

export function StratificationChart({ groups }: { groups: Summary[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const allValues = groups.flatMap(group => group.values);
  const domain = padDomain(allValues, 0.1);
  const counts = new Map(groups.map(group => [group.name, group.values.length]));

  return (
    <div className="h-[380px] w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 24, right: 20, bottom: 48, left: 60 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const yScale = scaleLinear({ domain, range: [innerHeight, 0], nice: true });
          const xScale = scaleBand({ domain: groups.map(group => group.name), range: [0, innerWidth], padding: 0.4 });
          const boxWidth = Math.min(88, xScale.bandwidth());
          const yTicks = yScale.ticks(5);

          return (
            <svg width={width} height={height} role="img" aria-label="Box plot comparison across groups">
              <Group top={margin.top} left={margin.left}>
                <HGrid ticks={yTicks} width={innerWidth} y={yScale} />
                {groups.map(group => {
                  const center = (xScale(group.name) ?? 0) + xScale.bandwidth() / 2;
                  const { min: low, q1, median, q3, max: high } = group.summary;
                  const active = hover === group.name;
                  const meanY = yScale(group.mean);
                  return (
                    <Group
                      key={group.name}
                      onMouseEnter={() => setHover(group.name)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <rect x={center - boxWidth / 2 - 8} y={0} width={boxWidth + 16} height={innerHeight} fill="transparent" />
                      <line x1={center} x2={center} y1={yScale(low)} y2={yScale(q1)} stroke={T.accent} strokeWidth={1.5} />
                      <line x1={center} x2={center} y1={yScale(q3)} y2={yScale(high)} stroke={T.accent} strokeWidth={1.5} />
                      <line x1={center - boxWidth / 4} x2={center + boxWidth / 4} y1={yScale(low)} y2={yScale(low)} stroke={T.accent} strokeWidth={1.5} />
                      <line x1={center - boxWidth / 4} x2={center + boxWidth / 4} y1={yScale(high)} y2={yScale(high)} stroke={T.accent} strokeWidth={1.5} />
                      <rect
                        x={center - boxWidth / 2}
                        y={yScale(q3)}
                        width={boxWidth}
                        height={Math.max(1, yScale(q1) - yScale(q3))}
                        fill={active ? "rgba(229,72,77,0.28)" : "rgba(229,72,77,0.16)"}
                        stroke={T.accent}
                        strokeWidth={1.5}
                      />
                      <line x1={center - boxWidth / 2} x2={center + boxWidth / 2} y1={yScale(median)} y2={yScale(median)} stroke={T.fg} strokeWidth={2} />
                      {group.values.map((value, index) => (
                        <circle
                          key={index}
                          cx={center + (((index * 37) % 100) / 100 - 0.5) * boxWidth * 0.5}
                          cy={yScale(value)}
                          r={2.5}
                          fill={T.fg}
                          opacity={0.35}
                        />
                      ))}
                      <path
                        d={`M${center},${meanY - 6} L${center + 6},${meanY} L${center},${meanY + 6} L${center - 6},${meanY} Z`}
                        fill={T.warn}
                        stroke={T.surface}
                      />
                      <text
                        x={center + boxWidth / 2 + 8}
                        y={meanY}
                        dy={4}
                        fill={T.warn}
                        fontSize={12}
                        fontFamily={T.mono}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {`mean ${fmt(group.mean, 2)}`}
                      </text>
                    </Group>
                  );
                })}
                <AxisLeft
                  scale={yScale}
                  tickValues={yTicks}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "end", dx: -4, dy: 4 })}
                />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  tickFormat={name => `${name} (n=${counts.get(String(name)) ?? 0})`}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "middle" })}
                />
                {hover &&
                  (() => {
                    const group = groups.find(item => item.name === hover);
                    if (!group) return null;
                    const center = (xScale(group.name) ?? 0) + xScale.bandwidth() / 2;
                    return (
                      <SvgTip
                        x={center}
                        y={yScale(group.summary.max)}
                        maxX={innerWidth}
                        lines={[
                          group.name,
                          `Median: ${fmt(group.summary.median, 3)}`,
                          `Q1 to Q3: ${fmt(group.summary.q1, 3)} to ${fmt(group.summary.q3, 3)}`,
                          `Min to max: ${fmt(group.summary.min, 3)} to ${fmt(group.summary.max, 3)}`,
                        ]}
                      />
                    );
                  })()}
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
