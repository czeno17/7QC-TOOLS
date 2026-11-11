"use client";

import { useState } from "react";
import { ParentSize } from "@visx/responsive";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { Bar } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { HGrid, SvgTip, T, axisLabelProps, axisLine, fmt, intTicks, tickLabelProps } from "./chart-theme";

type Props = { data: { name: string; value: number }[] };

export function CheckSheetChart({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-[360px] w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 24, right: 20, bottom: 88, left: 56 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleBand({ domain: data.map(item => item.name), range: [0, innerWidth], padding: 0.25 });
          const yScale = scaleLinear({
            domain: [0, Math.max(1, ...data.map(item => item.value))],
            range: [innerHeight, 0],
            nice: true,
          });
          const yTicks = intTicks(yScale.ticks(5));

          return (
            <svg width={width} height={height} role="img" aria-label="Defect frequency chart">
              <Group top={margin.top} left={margin.left}>
                <HGrid ticks={yTicks} width={innerWidth} y={yScale} />
                {data.map((item, index) => {
                  const barX = xScale(item.name) ?? 0;
                  const barY = yScale(item.value);
                  return (
                    <g key={`${item.name}-${index}`}>
                      <Bar
                        x={barX}
                        y={barY}
                        width={xScale.bandwidth()}
                        height={Math.max(0, innerHeight - barY)}
                        fill={T.accentFill}
                        stroke={hover === index ? T.fg : "none"}
                        rx={2}
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
                <AxisLeft
                  scale={yScale}
                  tickValues={yTicks}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "end", dx: -4, dy: 4 })}
                  label="Tally count"
                  labelProps={axisLabelProps}
                  labelOffset={30}
                />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  {...axisLine}
                  tickLabelProps={tickLabelProps({ textAnchor: "end", angle: -35, dx: -2, dy: 4 })}
                />
                {hover !== null && data[hover] && (
                  <SvgTip
                    x={(xScale(data[hover].name) ?? 0) + xScale.bandwidth() / 2}
                    y={yScale(data[hover].value)}
                    maxX={innerWidth}
                    lines={[data[hover].name, `Count: ${data[hover].value} (${fmt(total ? (data[hover].value / total) * 100 : 0, 1)}%)`]}
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
