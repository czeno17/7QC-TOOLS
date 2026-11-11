"use client";

import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Circle, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";

type Props = {
  data: number[];
  ucl: number;
  lcl: number;
  cl: number;
  label: string;
  flagged?: boolean[];
};

export default function ControlChart({ data, ucl, lcl, cl, label, flagged = [] }: Props) {
  const yMin = Math.min(lcl, ...data);
  const yMax = Math.max(ucl, ...data);
  const padding = (yMax - yMin) * 0.1 || 1;
  return (
    <div className="h-72 w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 24, right: 12, bottom: 36, left: 52 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleLinear({ domain: [0, Math.max(1, data.length - 1)], range: [0, innerWidth] });
          const yScale = scaleLinear({ domain: [yMin - padding, yMax + padding], range: [innerHeight, 0], nice: true });
          const points = data.map((value, index) => ({ x: index, y: value }));
          const limit = (value: number) => [{ x: 0, y: value }, { x: Math.max(1, data.length - 1), y: value }];

          return (
            <svg width={width} height={height} role="img" aria-label={`${label} control chart`}>
              <Group top={margin.top} left={margin.left}>
                <LinePath data={limit(ucl)} x={point => xScale(point.x)} y={point => yScale(point.y)} stroke="#e5484d" strokeDasharray="5 4" />
                <LinePath data={limit(cl)} x={point => xScale(point.x)} y={point => yScale(point.y)} stroke="#71717a" strokeDasharray="2 3" />
                <LinePath data={limit(lcl)} x={point => xScale(point.x)} y={point => yScale(point.y)} stroke="#e5484d" strokeDasharray="5 4" />
                <LinePath data={points} x={point => xScale(point.x)} y={point => yScale(point.y)} stroke="#fafafa" strokeWidth={1.5} />
                {points.map(point => (
                  <Circle key={point.x} cx={xScale(point.x)} cy={yScale(point.y)} r={4} fill={flagged[point.x] ? "#ffb224" : "#e5484d"} />
                ))}
                <AxisLeft scale={yScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#71717a", fontSize: 10 }} />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  numTicks={Math.min(10, data.length)}
                  tickFormat={value => `SG${Number(value) + 1}`}
                  stroke="#38383f"
                  tickStroke="#38383f"
                  tickLabelProps={{ fill: "#a1a1aa", fontSize: 9 }}
                />
                <text x={0} y={-8} fill="#a1a1aa" fontSize={10}>{label}</text>
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
