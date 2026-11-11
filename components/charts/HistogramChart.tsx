"use client";

import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Bar, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";

type Bin = { min: number; max: number; count: number };
type Point = { x: number; y: number };

type Props = {
  bins: Bin[];
  curve: Point[];
  yMax: number;
  lsl?: number;
  usl?: number;
};

export default function HistogramChart({ bins, curve, yMax, lsl, usl }: Props) {
  const min = bins[0]?.min ?? 0;
  const max = bins[bins.length - 1]?.max ?? 1;
  return (
    <div className="h-80 w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 16, right: 12, bottom: 36, left: 44 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleLinear({ domain: [min, max === min ? min + 1 : max], range: [0, innerWidth] });
          const yScale = scaleLinear({ domain: [0, Math.max(1, yMax)], range: [innerHeight, 0], nice: true });
          const barWidth = bins.length > 0 ? innerWidth / bins.length : 0;

          return (
            <svg width={width} height={height} role="img" aria-label="Histogram with fitted normal curve">
              <Group top={margin.top} left={margin.left}>
                {bins.map((bin, index) => (
                  <Bar
                    key={`${bin.min}-${index}`}
                    x={xScale(bin.min) + 1}
                    y={yScale(bin.count)}
                    width={Math.max(0, barWidth - 2)}
                    height={innerHeight - yScale(bin.count)}
                    fill="#e5484d"
                    stroke="#ec5d62"
                  />
                ))}
                {curve.length > 1 && (
                  <LinePath data={curve} x={point => xScale(point.x)} y={point => yScale(point.y)} stroke="#fafafa" strokeWidth={1.5} />
                )}
                {[lsl, usl].map((spec, index) => spec === undefined ? null : (
                  <LinePath
                    key={index}
                    data={[{ x: spec, y: 0 }, { x: spec, y: yMax }]}
                    x={point => xScale(point.x)}
                    y={point => yScale(point.y)}
                    stroke="#e5484d"
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                  />
                ))}
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
