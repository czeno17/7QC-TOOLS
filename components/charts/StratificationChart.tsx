"use client";

import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { summarizeStratification } from "@/lib/stats/stratification";

type Summary = ReturnType<typeof summarizeStratification>["groups"][number];

export function StratificationChart({ groups }: { groups: Summary[] }) {
  const allValues = groups.flatMap(group => group.values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const padding = (max - min) * 0.15 || 1;
  return (
    <div className="h-90 w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 16, right: 12, bottom: 40, left: 52 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const domain = [min - padding, max + padding];
          const yScale = scaleLinear({ domain, range: [innerHeight, 0] });
          const xScale = scaleBand({ domain: groups.map(group => group.name), range: [0, innerWidth], padding: 0.45 });
          const boxWidth = Math.min(72, xScale.bandwidth());
          return (
            <svg width={width} height={height} role="img" aria-label="Box plot comparison across groups">
              <Group top={margin.top} left={margin.left}>
                {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
                  const y = innerHeight * fraction;
                  return <line key={fraction} x1={0} x2={innerWidth} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />;
                })}
                {groups.map(group => {
                  const center = (xScale(group.name) ?? 0) + xScale.bandwidth() / 2;
                  const { min: low, q1, median, q3, max: high } = group.summary;
                  return (
                    <Group key={group.name}>
                      <line x1={center} x2={center} y1={yScale(low)} y2={yScale(q1)} stroke="#ec5d62" />
                      <line x1={center} x2={center} y1={yScale(q3)} y2={yScale(high)} stroke="#ec5d62" />
                      <line x1={center - boxWidth / 4} x2={center + boxWidth / 4} y1={yScale(low)} y2={yScale(low)} stroke="#ec5d62" />
                      <line x1={center - boxWidth / 4} x2={center + boxWidth / 4} y1={yScale(high)} y2={yScale(high)} stroke="#ec5d62" />
                      <rect x={center - boxWidth / 2} y={yScale(q3)} width={boxWidth} height={Math.max(1, yScale(q1) - yScale(q3))} fill="rgba(229,72,77,0.14)" stroke="#e5484d" />
                      <line x1={center - boxWidth / 2} x2={center + boxWidth / 2} y1={yScale(median)} y2={yScale(median)} stroke="#fafafa" strokeWidth={1.5} />
                      <text x={center} y={yScale(group.mean) - 8} fill="#fafafa" fontSize={10} textAnchor="middle">{group.mean.toFixed(2)}</text>
                    </Group>
                  );
                })}
                <AxisLeft scale={yScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#71717a", fontSize: 10 }} />
                <AxisBottom top={innerHeight} scale={xScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#a1a1aa", fontSize: 10 }} />
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
