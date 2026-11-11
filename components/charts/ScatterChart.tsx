"use client";

import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Circle, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";

type Props = {
  points: { x: number; y: number }[];
  regression: { slope: number; intercept: number };
  xLabel: string;
  yLabel: string;
};

export default function ScatterChart({ points, regression, xLabel, yLabel }: Props) {
  const xMin = Math.min(...points.map(point => point.x));
  const xMax = Math.max(...points.map(point => point.x));
  const regressionLine = [
    { x: xMin, y: regression.slope * xMin + regression.intercept },
    { x: xMax, y: regression.slope * xMax + regression.intercept },
  ];
  return (
    <div className="h-80 w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 16, right: 16, bottom: 56, left: 52 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xDomain = xMin === xMax ? [xMin - 1, xMax + 1] : [xMin, xMax];
          const yMin = Math.min(...points.map(point => point.y), ...regressionLine.map(point => point.y));
          const yMax = Math.max(...points.map(point => point.y), ...regressionLine.map(point => point.y));
          const yDomain = yMin === yMax ? [yMin - 1, yMax + 1] : [yMin, yMax];
          const xScale = scaleLinear({ domain: xDomain, range: [0, innerWidth], nice: true });
          const yScale = scaleLinear({ domain: yDomain, range: [innerHeight, 0], nice: true });

          return (
            <svg width={width} height={height} role="img" aria-label={`${xLabel} versus ${yLabel} scatter diagram`}>
              <Group top={margin.top} left={margin.left}>
                <LinePath data={regressionLine} x={point => xScale(point.x)} y={point => yScale(point.y)} stroke="#fafafa" strokeWidth={1.5} strokeDasharray="5 4" />
                {points.map((point, index) => (
                  <Circle key={index} cx={xScale(point.x)} cy={yScale(point.y)} r={4} fill="#e5484d" stroke="#ec5d62" />
                ))}
                <AxisLeft scale={yScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#71717a", fontSize: 10 }} />
                <AxisBottom top={innerHeight} scale={xScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#a1a1aa", fontSize: 10 }} />
                <text x={innerWidth / 2} y={innerHeight + 48} fill="#71717a" textAnchor="middle" fontSize={10}>{xLabel}</text>
                <text transform={`translate(-42 ${innerHeight / 2}) rotate(-90)`} fill="#71717a" textAnchor="middle" fontSize={10}>{yLabel}</text>
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
