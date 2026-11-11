import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { Bar, LinePath } from "@visx/shape";
import { AxisLeft, AxisBottom, AxisRight } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { scaleBand, scaleLinear } from "@visx/scale";
import { ParetoResult } from "@/lib/parse/pareto";

export function ParetoChart({ items, cumPct, idx80 }: ParetoResult) {
  return (
    <div className="h-80 w-full">
      <ParentSize>
        {({ width, height }) => {
          const margin = { top: 16, right: 52, bottom: 72, left: 48 };
          const innerWidth = Math.max(0, width - margin.left - margin.right);
          const innerHeight = Math.max(0, height - margin.top - margin.bottom);
          const xScale = scaleBand({ domain: items.map(item => item.name), range: [0, innerWidth], padding: 0.2 });
          const maxValue = Math.max(1, ...items.map(item => item.value));
          const yScale = scaleLinear({ domain: [0, maxValue], range: [innerHeight, 0], nice: true });
          const pctScale = scaleLinear({ domain: [0, 100], range: [innerHeight, 0] });

          return (
            <svg width={width} height={height} role="img" aria-label="Pareto frequency and cumulative percentage chart">
              <Group top={margin.top} left={margin.left}>
                {items.map((item, index) => (
                  <Bar
                    key={`${item.name}-${index}`}
                    x={xScale(item.name)}
                    y={yScale(item.value)}
                    width={xScale.bandwidth()}
                    height={innerHeight - yScale(item.value)}
                    fill={index <= idx80 ? "#e5484d" : "rgba(229,72,77,0.25)"}
                  />
                ))}
                <line x1={0} x2={innerWidth} y1={pctScale(80)} y2={pctScale(80)} stroke="rgba(255,178,36,0.55)" strokeDasharray="4 4" />
                <LinePath
                  data={items.map((item, index) => ({
                    x: (xScale(item.name) ?? 0) + xScale.bandwidth() / 2,
                    y: pctScale(cumPct[index] ?? 0),
                  }))}
                  x={point => point.x}
                  y={point => point.y}
                  curve={curveMonotoneX}
                  stroke="#ffb224"
                  strokeWidth={2}
                />
                <AxisLeft scale={yScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#71717a", fontSize: 10 }} />
                <AxisRight left={innerWidth} scale={pctScale} stroke="#38383f" tickStroke="#38383f" tickLabelProps={{ fill: "#ffb224", fontSize: 10 }} />
                <AxisBottom
                  top={innerHeight}
                  scale={xScale}
                  stroke="#38383f"
                  tickStroke="#38383f"
                  tickLabelProps={{ fill: "#a1a1aa", fontSize: 10, textAnchor: "end", angle: -35 }}
                />
              </Group>
            </svg>
          );
        }}
      </ParentSize>
    </div>
  );
}
