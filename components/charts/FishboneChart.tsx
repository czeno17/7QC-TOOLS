"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear } from "@visx/scale";
import { Text } from "@visx/text";
import type { FishboneCategory } from "@/lib/stats/fishbone";
import { T } from "./chart-theme";

type Props = {
  effect: string;
  categories: FishboneCategory[];
};

type WrappedText = {
  lines: string[];
  width: number;
};

// Fonts and base text size come from the shared chart theme.
const FONT_SANS = T.sans;
const FONT_MONO = T.mono;
const EFFECT_FONT_SIZE = 14;

function measureTextWidth(text: string, font: string, fontSize: number) {
  if (typeof document === "undefined") return text.length * fontSize * 0.58;

  const context = document.createElement("canvas").getContext("2d");
  if (!context) return text.length * fontSize * 0.58;
  const fontVariable = font.includes("plex-mono") ? "--font-plex-mono" : "--font-plex-sans";
  const resolvedFont = getComputedStyle(document.documentElement).getPropertyValue(fontVariable).trim() || font;
  context.font = `${fontSize}px ${resolvedFont}`;
  return context.measureText(text).width;
}

function wrapText(text: string, maxLineLength: number, maxLines: number, fontSize: number = T.tickSize): WrappedText {
  const normalized = text.trim().replace(/\s+/g, " ");
  const targetLength = Math.max(maxLineLength, Math.ceil(normalized.length / maxLines));
  const lines: string[] = [];
  let remainder = normalized;

  while (remainder.length > targetLength && lines.length < maxLines - 1) {
    let breakAt = remainder.lastIndexOf(" ", targetLength);
    if (breakAt < targetLength / 2) {
      const nextBreak = remainder.indexOf(" ", targetLength);
      breakAt = nextBreak >= 0 && nextBreak <= targetLength * 1.3 ? nextBreak : targetLength;
    }
    lines.push(remainder.slice(0, breakAt).trimEnd());
    remainder = remainder.slice(breakAt).trimStart();
  }
  lines.push(remainder);

  return {
    lines,
    width: Math.max(...lines.map(line => measureTextWidth(line, FONT_SANS, fontSize)), 0),
  };
}

function TextLines({
  lines,
  x,
  y,
  anchor = "end",
  fill = "var(--color-fg-2, #a1a1aa)",
  fontFamily = FONT_SANS,
  fontSize = T.tickSize,
  fontWeight = 400,
  lineHeight = 14,
}: {
  lines: string[];
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
}) {
  const firstLineY = y - ((lines.length - 1) * lineHeight) / 2;

  return (
    <>
      {lines.map((line, index) => (
        <Text
          key={`${index}-${line}`}
          x={x}
          y={firstLineY + index * lineHeight}
          textAnchor={anchor}
          verticalAnchor="middle"
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={fontWeight}
          fill={fill}
          aria-hidden="true"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {line}
        </Text>
      ))}
    </>
  );
}

export function FishboneChart({ effect, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const [measuredWidth, setMeasuredWidth] = useState(640);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const width = chartContainerRef.current?.clientWidth ?? 0;
      if (width > 0) setMeasuredWidth(width);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const orderedCategories = useMemo(() => {
    // Keep the legacy 6M pairing: Man / Machine, Method / Material, Measurement / Environment.
    const order = ["Man", "Machine", "Method", "Material", "Measurement", "Environment"];
    const ordered = order
      .map(name => categories.find(category => category.name.toLowerCase() === name.toLowerCase()))
      .filter((category): category is FishboneCategory => Boolean(category));
    const remaining = categories.filter(category => !ordered.some(item => item.name === category.name));
    return [...ordered, ...remaining];
  }, [categories]);

  const causeLayouts = useMemo(
    () => orderedCategories.map(category => ({
      category,
      causes: category.causes.map((cause, index) => ({
        cause,
        index,
        wrapped: wrapText(cause, 28, 2),
      })),
    })),
    [orderedCategories],
  );

  const pillWidths = causeLayouts.map(({ category }) => (
    measureTextWidth(`${category.name.toUpperCase()} · ${category.causes.length}`, FONT_MONO, T.tickSize) + 22
  ));
  const longestCause = Math.max(...causeLayouts.flatMap(item => item.causes.map(cause => cause.wrapped.width)), 0);
  const largestPill = Math.max(...pillWidths, 88);
  const categoryBands = useMemo(() => {
    let topDistance = 0;
    let bottomDistance = 0;

    return causeLayouts.map((layout, index) => {
      const isTop = index % 2 === 0;
      const laneHeight = Math.max(36, (layout.causes.length + 1) * 30);
      const previousDistance = isTop ? topDistance : bottomDistance;
      const branchDistance = previousDistance + laneHeight;
      if (isTop) topDistance = branchDistance;
      else bottomDistance = branchDistance;
      return { ...layout, index, isTop, laneHeight, previousDistance, branchDistance };
    });
  }, [causeLayouts]);
  const maxBranchDistance = Math.max(
    ...categoryBands.filter(category => category.index % 2 === 0).map(category => category.branchDistance),
    ...categoryBands.filter(category => category.index % 2 === 1).map(category => category.branchDistance),
    0,
  );
  const height = Math.max(380, maxBranchDistance * 2 + 72);
  const spineY = height / 2;

  return (
    <div className="space-y-3">
      <div
        ref={chartContainerRef}
        className="-mx-5"
        style={{ width: "calc(100% + 2.5rem)", height }}
      >
        {(() => {
          const chartWidth = Math.max(measuredWidth, 320);
          const maxEffectLineLength = Math.max(10, Math.floor((chartWidth * 0.3 - 24) / 7.3));
          const effectLines = wrapText(effect || "Problem Effect", maxEffectLineLength, 4, EFFECT_FONT_SIZE);
          const effectBoxWidth = Math.max(96, effectLines.width + 24);
          const effectBoxHeight = Math.max(76, effectLines.lines.length * 18 + 16);
          const headX = chartWidth - effectBoxWidth - 14;
          const spineStart = Math.max(longestCause + 24, Math.min(chartWidth * 0.42, headX - 60));
          const attachmentScale = scaleLinear({
            domain: [0, Math.max(orderedCategories.length - 1, 1)],
            range: [spineStart, headX - 12],
          });
          const renderedCategories = categoryBands.map(layout => {
            const attachmentX = attachmentScale(layout.index);
            const outerY = spineY + (layout.isTop ? -layout.branchDistance : layout.branchDistance);
            const orderedCauses = [...layout.causes].sort((a, b) => b.wrapped.width - a.wrapped.width);
            const count = layout.causes.length;
            const pillWidth = Math.max(pillWidths[layout.index] ?? 88, largestPill);
            const pillHeight = 24;

            return {
              ...layout,
              attachmentX,
              outerY,
              orderedCauses,
              pillWidth,
              pillHeight,
              count,
            };
          });
          const maxAngleFactor = renderedCategories.reduce((minimum, entry) => {
            const pillLimit = (entry.attachmentX - entry.pillWidth / 2 - 12) / entry.branchDistance;
            const sortedCauses = [...entry.causes].sort((a, b) => b.wrapped.width - a.wrapped.width);
            const causeLimit = sortedCauses.reduce((causeMinimum, cause, index) => {
              const distance = entry.previousDistance + (index + 1) * 30;
              return Math.min(causeMinimum, (entry.attachmentX - cause.wrapped.width - 22) / distance);
            }, Number.POSITIVE_INFINITY);
            return Math.min(minimum, pillLimit, causeLimit);
          }, 1 / Math.sqrt(3));
          const angleFactor = Math.max(0.01, maxAngleFactor);
          const chartHeight = height;
          const arrowSize = 7;
          const ariaDescription = `Fishbone diagram for ${effect || "Problem Effect"}. ${renderedCategories
            .map(({ category, count }) => `${category.name}: ${count} ${count === 1 ? "cause" : "causes"}`)
            .join("; ")}.`;

          return (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="block h-auto w-full"
              role="img"
              aria-label={ariaDescription}
              preserveAspectRatio="xMinYMin meet"
              style={{ overflow: "visible" }}
            >
              {renderedCategories.map(entry => {
                const isActive = activeCategory === entry.category.name;
                const isDimmed = activeCategory !== null && !isActive;
                const isTop = entry.isTop;
                const outerX = entry.attachmentX - entry.branchDistance * angleFactor;
                const pillX = outerX - entry.pillWidth / 2;
                const pillY = entry.outerY - entry.pillHeight / 2;

                return (
                  <g
                    key={entry.category.name}
                    opacity={isDimmed ? 0.2 : 1}
                    onMouseEnter={() => setActiveCategory(entry.category.name)}
                    onMouseLeave={() => setActiveCategory(null)}
                    onFocus={() => setActiveCategory(entry.category.name)}
                    onBlur={() => setActiveCategory(null)}
                    role="button"
                    aria-label={`${entry.category.name}, ${entry.count} ${entry.count === 1 ? "cause" : "causes"}`}
                    aria-pressed={isActive}
                    tabIndex={0}
                    style={{ cursor: "pointer", outline: "none" }}
                  >
                    <line
                      x1={outerX}
                      y1={entry.outerY}
                      x2={entry.attachmentX}
                      y2={spineY}
                      stroke="var(--color-accent, #e5484d)"
                      strokeWidth={isActive ? 2.5 : 1.75}
                      strokeLinecap="round"
                    />
                    {entry.orderedCauses.map(({ cause, index, wrapped }, causeIndex) => {
                      const distance = entry.previousDistance + (causeIndex + 1) * 30;
                      const x = entry.attachmentX - distance * angleFactor;
                      const y = spineY + (isTop ? -distance : distance);
                      const ribEndX = x - 14;
                      const labelX = ribEndX - 4;

                      return (
                        <g key={`${entry.category.name}-${index}`}>
                          <line
                            x1={x}
                            y1={y}
                            x2={ribEndX}
                            y2={y}
                            stroke="var(--color-accent, #e5484d)"
                            strokeOpacity={isActive ? 0.85 : 0.55}
                            strokeWidth={isActive ? 1.8 : 1.25}
                          />
                          <TextLines lines={wrapped.lines} x={labelX} y={y} />
                          <title>{cause}</title>
                        </g>
                      );
                    })}
                    <rect
                      x={pillX}
                      y={pillY}
                      width={entry.pillWidth}
                      height={entry.pillHeight}
                      rx={12}
                      fill="var(--color-accent-subtle, rgba(229,72,77,0.10))"
                      stroke="var(--color-accent, #e5484d)"
                      strokeWidth={isActive ? 2 : entry.count ? 1.25 : 1}
                      strokeOpacity={entry.count ? 1 : 0.45}
                    />
                    <Text
                      x={outerX}
                      y={entry.outerY}
                      textAnchor="middle"
                      verticalAnchor="middle"
                      fontFamily={FONT_MONO}
                      fontSize={T.tickSize}
                      fontWeight={500}
                      fill="var(--color-accent, #e5484d)"
                      opacity={entry.count ? 1 : 0.55}
                      aria-hidden="true"
                      style={{ fontVariantNumeric: "tabular-nums", pointerEvents: "none" }}
                    >
                      {`${entry.category.name.toUpperCase()} · ${entry.count}`}
                    </Text>
                  </g>
                );
              })}

              <line
                x1={spineStart}
                y1={spineY}
                x2={headX - arrowSize * 2}
                y2={spineY}
                stroke="var(--color-fg, #fafafa)"
                strokeWidth={2}
              />
              <path
                d={`M${headX - arrowSize * 2},${spineY - arrowSize} L${headX + 2},${spineY} L${headX - arrowSize * 2},${spineY + arrowSize} Z`}
                fill="var(--color-fg, #fafafa)"
              />
              <rect
                x={headX}
                y={spineY - effectBoxHeight / 2}
                width={effectBoxWidth}
                height={effectBoxHeight}
                rx={12}
                fill="var(--color-accent-subtle, rgba(229,72,77,0.10))"
                stroke="var(--color-accent, #e5484d)"
                strokeWidth={1.5}
              />
              <TextLines
                lines={effectLines.lines}
                x={headX + effectBoxWidth / 2}
                y={spineY}
                anchor="middle"
                fill="var(--color-fg, #fafafa)"
                fontSize={EFFECT_FONT_SIZE}
                fontWeight={600}
                lineHeight={18}
              />
            </svg>
          );
        })()}
      </div>

      <button
        type="button"
        className="rounded border border-border px-3 py-1.5 text-xs text-fg-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent print:hidden"
        aria-expanded={showList}
        onClick={() => setShowList(visible => !visible)}
      >
        {showList ? "Hide list" : "View as list"}
      </button>
      <div className={`${showList ? "block" : "hidden"} print:block`}>
        <ul className="space-y-3 text-sm text-fg-2">
          {orderedCategories.map(category => (
            <li key={category.name}>
              <h3 className="font-medium text-fg">
                {category.name} <span className="font-normal text-fg-3">({category.causes.length})</span>
              </h3>
              {category.causes.length ? (
                <ul className="ml-5 mt-1 list-disc space-y-1">
                  {category.causes.map((cause, index) => <li key={`${category.name}-${index}`}>{cause}</li>)}
                </ul>
              ) : (
                <p className="ml-5 mt-1 text-fg-3">No causes listed</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
