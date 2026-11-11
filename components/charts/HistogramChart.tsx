"use client";

import { useState } from "react";
import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Bar, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import {
  HGrid,
  SvgTip,
  T,
  axisLabelProps,
  axisLine,
  fmt,
  intTicks,
  tickLabelProps,
} from "./chart-theme";

type Bin = { min: number; max: number; count: number };
type Point = { x: number; y: number };

type Props = {
  bins: Bin[];
  curve: Point[];
  yMax: number;
  lsl?: number;
  usl?: number;
  mean?: number;
};

export default function HistogramChart({ bins, curve, yMax, lsl, usl, mean }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const xValues = [
    bins[0]?.min ?? 0,
    bins[bins.length - 1]?.max ?? 1,
    ...[lsl, usl, mean].filter((value): value is number => value !== undefined),
  ];
  const lo = Math.min(...xValues);
  const hi = Math.max(...xValues);
  const pad = (hi - lo) * 0.03 || 0.5;

  return (
    <div className="h-[360px] w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 30, right: 20, bottom: 44, left: 56 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleLinear({ domain: [lo - pad, hi + pad], range: [0, innerWidth], nice: true });
          const yScale = scaleLinear({ domain: [0, Math.max(1, yMax)], range: [innerHeight, 0], nice: true });
          const yTicks = intTicks(yScale.ticks(5));
          const yTop = yScale.domain()[1];

          const markers = [
            { key: "lsl", label: "LSL", value: lsl, color: T.warn, dash: "6 4" },
            { key: "usl", label: "USL", value: usl, color: T.warn, dash: "6 4" },
            { key: "mean", label: "Mean", value: mean, color: T.fg, dash: "2 4" },
          ].filter((marker): marker is typeof marker & { value: number } => marker.value !== undefined);

          return (
            <svg width={width} height={height} role="img" aria-label="Histogram with fitted normal curve">
              <Group top={margin.top} left={margin.left}>
                <HGrid ticks={yTicks} width={innerWidth} y={yScale} />
                {bins.map((bin, index) => {
                  const barX = xScale(bin.min) + 1;
                  const barWidth = Math.max(0, xScale(bin.max) - xScale(bin.min) - 2);
                  return (
                    <g key={`${bin.min}-${index}`}>
                      <Bar
                        x={barX}
                        y={yScale(bin.count)}
                        width={barWidth}
                        height={Math.max(0, innerHeight - yScale(bin.count))}
                        fill={hover === index ? T.accent : T.accentFill}
                        stroke={T.accent}
                        onMouseEnter={() => setHover(index)}
                        onMouseLeave={() => setHover(null)}
                      />
                      {barWidth >= 22 && bin.count > 0 && (
                        <text
                          x={barX + barWidth / 2}
                          y={yScale(bin.count) - 6}
                          textAnchor="middle"
                          fill={T.text}
                          fontSize={12}
                          fontFamily={T.sans}
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {bin.count}
                        </text>
                      )}
                    </g>
                  );
                })}
                {curve.length > 1 && (
                  <LinePath
                    data={curve}
                    x={point => xScale(point.x)}
                    y={point => yScale(point.y)}
                    stroke={T.fg}
                    strokeWidth={2}
                  />
                )}
                {markers.map(marker => (
                  <g key={marker.key}>
                    <line
                      x1={xScale(marker.value)}
                      x2={xScale(marker.value)}
                      y1={yScale(yTop)}
                      y2={yScale(0)}
                      stroke={marker.color}
                      strokeWidth={1.5}
                      strokeDasharray={marker.dash}
                    />
                    <text
                      x={xScale(marker.value)}
                      y={-10}
                      textAnchor="middle"
                      fill={marker.color}
                      fontSize={12}
                      fontFamily={T.mono}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {`${marker.label} ${fmt(marker.value, 3)}`}
                    </text>
                  </g>
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
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  numTicks={Math.max(3, Math.min(8, Math.floor(innerWidth / 80)))}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "middle" })}
                />
                {hover !== null && bins[hover] && (
                  <SvgTip
                    x={xScale((bins[hover].min + bins[hover].max) / 2)}
                    y={yScale(bins[hover].count)}
                    maxX={innerWidth}
                    lines={[`${fmt(bins[hover].min, 3)} to ${fmt(bins[hover].max, 3)}`, `Count: ${bins[hover].count}`]}
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
