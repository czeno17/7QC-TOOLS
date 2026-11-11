"use client";

import { Group } from "@visx/group";
import { Line } from "@visx/shape";
import type { FishboneCategory } from "@/lib/stats/fishbone";

type Props = {
  effect: string;
  categories: FishboneCategory[];
};

export function FishboneChart({ effect, categories }: Props) {
  const top = categories.filter((_, index) => index % 2 === 0);
  const bottom = categories.filter((_, index) => index % 2 === 1);
  const spineY = 230;
  const headX = 900;
  const spacingX = 800 / (Math.max(top.length, bottom.length, 1) + 0.4);

  return (
    <svg
      viewBox="0 0 1000 460"
      className="h-auto w-full"
      role="img"
      aria-label={`Fishbone diagram: ${effect}`}
    >
      <rect width="1000" height="460" fill="#0e0e10" />
      <Group>
        <Line from={{ x: 50, y: spineY }} to={{ x: headX, y: spineY }} stroke="#fafafa" strokeWidth={2} />
        <path d={`M${headX},${spineY - 42} L${headX + 76},${spineY} L${headX},${spineY + 42} Z`} fill="#e5484d" />
        <foreignObject x={headX + 2} y={spineY - 35} width={70} height={70}>
          <div className="flex h-full items-center justify-center break-words px-1 text-center text-xs font-semibold text-white">
            {effect}
          </div>
        </foreignObject>
        {[...top.map((category, index) => ({ category, index, isTop: true })), ...bottom.map((category, index) => ({ category, index, isTop: false }))].map(({ category, index, isTop }) => {
          const bx = 100 + (index + 1) * spacingX;
          const by = spineY + (isTop ? -145 : 145);
          const count = category.causes.length;

          return (
            <Group key={category.name}>
              <Line from={{ x: bx, y: spineY }} to={{ x: bx + 60, y: by }} stroke="#ec5d62" strokeWidth={1.5} />
              <text
                x={bx + 66}
                y={by + (isTop ? -12 : 12)}
                fill="#fafafa"
                fontSize={11}
                fontWeight={700}
                textAnchor="start"
              >
                {category.name.toUpperCase()}
              </text>
              {category.causes.slice(0, 6).map((cause, causeIndex) => {
                const t = (causeIndex + 1) / (count + 1);
                const x = bx + 60 * t;
                const y = spineY + (by - spineY) * t;
                const tickX = x - 9;
                const tickY = y + (isTop ? 13 : -13);
                const label = cause.length > 24 ? `${cause.slice(0, 22)}…` : cause;

                return (
                  <Group key={`${category.name}-${causeIndex}`}>
                    <Line from={{ x, y }} to={{ x: tickX, y: tickY }} stroke="rgba(229,72,77,0.55)" />
                    <text
                      x={tickX - 3}
                      y={tickY + (isTop ? 8 : -8)}
                      fill="#a1a1aa"
                      fontSize={10}
                      textAnchor="end"
                    >
                      {label}
                    </text>
                    <title>{cause}</title>
                  </Group>
                );
              })}
            </Group>
          );
        })}
      </Group>
    </svg>
  );
}
