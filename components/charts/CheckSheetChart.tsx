"use client";

import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";

type Props = { data: { name: string; value: number }[] };

export function CheckSheetChart({ data }: Props) {
  return (
    <div className="h-80 w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 10, right: 12, bottom: 56, left: 44 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleBand({ domain: data.map(item => item.name), range: [0, innerWidth], padding: 0.2 });
          const yScale = scaleLinear({ domain: [0, Math.max(1, ...data.map(item => item.value))], range: [innerHeight, 0], nice: true });
          return (
            <svg width={width} height={height} role="img" aria-label="Defect frequency chart">
              <Group top={margin.top} left={margin.left}>
                {data.map((item, index) => (
                  <Bar key={`${item.name}-${index}`} x={xScale(item.name)} y={yScale(item.value)} width={xScale.bandwidth()} height={innerHeight - yScale(item.value)} fill="#e5484d" rx={3} />
                ))}
                <AxisLeft scale={yScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#71717a", fontSize: 10 }} />
                <AxisBottom top={innerHeight} scale={xScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#a1a1aa", fontSize: 10, textAnchor: "end", angle: -35 }} />
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
