"use client";

import { useId, useState } from "react";
import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Circle, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import {
  HGrid,
  SvgTip,
  T,
  axisLabelProps,
  axisLine,
  fmt,
  padDomain,
  signed,
  tickLabelProps,
} from "./chart-theme";

type Props = {
  points: { x: number; y: number }[];
  regression: { slope: number; intercept: number };
  xLabel: string;
  yLabel: string;
};

export default function ScatterChart({ points, regression, xLabel, yLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = `scatter-clip-${useId().replace(/:/g, "")}`;

  if (points.length === 0) return <div className="h-[360px] w-full" />;

  const xDomain = padDomain(points.map(point => point.x));
  const yDomain = padDomain(points.map(point => point.y));
  const equation = `y = ${signed(regression.slope, 4)}x ${regression.intercept < 0 ? "\u2212" : "+"} ${Math.abs(
    regression.intercept,
  ).toFixed(2)}`;

  return (
    <div className="h-[360px] w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 28, right: 20, bottom: 60, left: 64 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleLinear({ domain: xDomain, range: [0, innerWidth], nice: true });
          const yScale = scaleLinear({ domain: yDomain, range: [innerHeight, 0], nice: true });
          const [x0, x1] = xScale.domain();
          const line = [
            { x: x0, y: regression.slope * x0 + regression.intercept },
            { x: x1, y: regression.slope * x1 + regression.intercept },
          ];
          const yTicks = yScale.ticks(5);
          const xTicks = xScale.ticks(6);

          return (
            <svg width={width} height={height} role="img" aria-label={`${xLabel} versus ${yLabel} scatter diagram`}>
              <defs>
                <clipPath id={clipId}>
                  <rect x={0} y={0} width={innerWidth} height={innerHeight} />
                </clipPath>
              </defs>
              <Group top={margin.top} left={margin.left}>
                <HGrid ticks={yTicks} width={innerWidth} y={yScale} />
                <g clipPath={`url(#${clipId})`}>
                  <LinePath
                    data={line}
                    x={point => xScale(point.x)}
                    y={point => yScale(point.y)}
                    stroke={T.fg}
                    strokeWidth={2}
                    strokeDasharray="6 5"
                  />
                </g>
                {points.map((point, index) => (
                  <Circle
                    key={index}
                    cx={xScale(point.x)}
                    cy={yScale(point.y)}
                    r={hover === index ? 7 : 5}
                    fill={T.accentFill}
                    stroke={T.surface}
                    strokeWidth={1}
                    onMouseEnter={() => setHover(index)}
                    onMouseLeave={() => setHover(null)}
                  />
                ))}
                <text
                  x={innerWidth - 4}
                  y={-10}
                  textAnchor="end"
                  fill={T.fg}
                  fontSize={12}
                  fontFamily={T.mono}
                >
                  {equation}
                </text>
                <AxisLeft
                  scale={yScale}
                  tickValues={yTicks}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "end", dx: -4, dy: 4 })}
                  label={yLabel}
                  labelProps={axisLabelProps}
                  labelOffset={38}
                />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  tickValues={xTicks}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "middle" })}
                  label={xLabel}
                  labelProps={axisLabelProps}
                  labelOffset={8}
                />
                {hover !== null && points[hover] && (
                  <SvgTip
                    x={xScale(points[hover].x)}
                    y={yScale(points[hover].y)}
                    maxX={innerWidth}
                    lines={[`Pair ${hover + 1}`, `${xLabel}: ${fmt(points[hover].x)}`, `${yLabel}: ${fmt(points[hover].y)}`]}
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
