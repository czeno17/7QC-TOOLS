"use client";

import { useState } from "react";
import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { Bar, LinePath } from "@visx/shape";
import { AxisLeft, AxisBottom, AxisRight } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { scaleBand, scaleLinear } from "@visx/scale";
import type { ParetoResult } from "@/lib/parse/pareto";
import { HGrid, SvgTip, T, axisLabelProps, axisLine, fmt, intTicks, tickLabelProps } from "./chart-theme";

export function ParetoChart({ items, cumPct, idx80 }: ParetoResult) {
  const [hover, setHover] = useState<number | null>(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[380px] w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 24, right: 64, bottom: 92, left: 56 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleBand({ domain: items.map(item => item.name), range: [0, innerWidth], padding: 0.25 });
          const maxValue = Math.max(1, ...items.map(item => item.value));
          const yScale = scaleLinear({ domain: [0, maxValue], range: [innerHeight, 0], nice: true });
          const pctScale = scaleLinear({ domain: [0, 100], range: [innerHeight, 0] });
          const yTicks = intTicks(yScale.ticks(5));
          const pctTicks = [0, 20, 40, 60, 80, 100];
          const cumPoints = items.map((item, index) => ({
            x: (xScale(item.name) ?? 0) + xScale.bandwidth() / 2,
            y: pctScale(cumPct[index] ?? 0),
          }));

          return (
            <svg width={width} height={height} role="img" aria-label="Pareto frequency and cumulative percentage chart">
              <Group top={margin.top} left={margin.left}>
                <HGrid ticks={yTicks} width={innerWidth} y={yScale} />
                {items.map((item, index) => {
                  const barX = xScale(item.name) ?? 0;
                  const barY = yScale(item.value);
                  return (
                    <g key={`${item.name}-${index}`}>
                      <Bar
                        x={barX}
                        y={barY}
                        width={xScale.bandwidth()}
                        height={Math.max(0, innerHeight - barY)}
                        rx={2}
                        fill={index <= idx80 ? T.accentFill : T.accentDim}
                        stroke={hover === index ? T.fg : "none"}
                        onMouseEnter={() => setHover(index)}
                        onMouseLeave={() => setHover(null)}
                      />
                      <text
                        x={barX + xScale.bandwidth() / 2}
                        y={barY - 6}
                        textAnchor="middle"
                        fill={T.text}
                        fontSize={12}
                        fontFamily={T.sans}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {item.value}
                      </text>
                    </g>
                  );
                })}
                <line x1={0} x2={innerWidth} y1={pctScale(80)} y2={pctScale(80)} stroke="rgba(255,178,36,0.6)" strokeDasharray="5 4" />
                <text x={6} y={pctScale(80) - 6} fill={T.warn} fontSize={12} fontFamily={T.mono}>
                  80%
                </text>
                <LinePath data={cumPoints} x={point => point.x} y={point => point.y} curve={curveMonotoneX} stroke={T.warn} strokeWidth={2} />
                {cumPoints.map((point, index) => (
                  <circle key={index} cx={point.x} cy={point.y} r={4} fill={T.warn} stroke={T.surface} />
                ))}
                <AxisLeft
                  scale={yScale}
                  tickValues={yTicks}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "end", dx: -4, dy: 4 })}
                  label="Frequency"
                  labelProps={axisLabelProps}
                  labelOffset={30}
                />
                <AxisRight
                  left={innerWidth}
                  scale={pctScale}
                  tickValues={pctTicks}
                  tickFormat={value => `${value}%`}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "start", dx: 4, dy: 4, fill: T.warn })}
                />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "end", angle: -35, dx: -2, dy: 4 })}
                />
                {hover !== null && items[hover] && (
                  <SvgTip
                    x={(xScale(items[hover].name) ?? 0) + xScale.bandwidth() / 2}
                    y={yScale(items[hover].value)}
                    maxX={innerWidth}
                    lines={[
                      items[hover].name,
                      `Count: ${items[hover].value} (${fmt(total ? (items[hover].value / total) * 100 : 0, 1)}%)`,
                      `Cumulative: ${fmt(cumPct[hover] ?? 0, 1)}%`,
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
