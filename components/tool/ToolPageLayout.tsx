"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useToolStore } from "@/store/tools";

type Props = {
  title: string;
  description: string;
  input: ReactNode;
  result: ReactNode;
  resultTitle?: string;
};

export function ToolPageLayout({ title, description, input, result, resultTitle = "Results" }: Props) {
  return (
    <main className="mx-auto w-full max-w-360 p-5 sm:p-8">
      <header className="mb-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-4">7 Quality Control Tools</p>
        <h1 className="text-2xl font-semibold text-fg">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-fg-2">{description}</p>
      </header>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="min-w-0 rounded-lg border border-border bg-bg-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Data entry</h2>
          </div>
          <div className="space-y-4 p-5">{input}</div>
        </section>
        <section className="min-w-0 rounded-lg border border-border bg-bg-1">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">{resultTitle}</h2>
          </div>
          <div className="space-y-4 p-5">{result}</div>
        </section>
      </div>
    </main>
  );
}

export function ToolReportCapture({
  toolId,
  captureKey,
  children,
}: {
  toolId: string;
  captureKey: object | null;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const updateTool = useToolStore(state => state.updateTool);

  useEffect(() => {
    if (!captureKey) return;
    let frame = 0;
    let attempts = 0;

    const capture = () => {
      const container = containerRef.current;
      const chartSvgs = container
        ? Array.from(container.querySelectorAll("svg"))
            .filter(svg => !svg.parentElement?.closest("svg"))
            .map(svg => svg.outerHTML)
        : [];
      if (!chartSvgs.length && attempts++ < 20) {
        frame = requestAnimationFrame(capture);
        return;
      }

      const state = useToolStore.getState().tools[toolId];
      if (!state?.data) return;
      const tableHtmls = container
        ? Array.from(container.querySelectorAll("table"), table => table.outerHTML)
        : [];
      updateTool(toolId, { ...state.data, chartSvgs, tableHtmls }, state.done);
    };

    frame = requestAnimationFrame(capture);
    return () => cancelAnimationFrame(frame);
  }, [captureKey, toolId, updateTool]);

  return <div ref={containerRef} className="flex flex-col gap-4">{children}</div>;
}

export function ToolActions({
  onGenerate,
  onExample,
  onClear,
  generateLabel = "Generate",
}: {
  onGenerate?: () => void;
  onExample: () => void;
  onClear: () => void;
  generateLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {onGenerate && <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white">{generateLabel}</button>}
      <button type="button" onClick={onExample} className="rounded bg-bg-2 px-4 py-2 text-sm text-fg">Load example</button>
      <button type="button" onClick={onClear} className="rounded border border-border px-4 py-2 text-sm text-fg-2">Clear</button>
    </div>
  );
}

export function ToolError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="text-sm text-accent">{children}</p>;
}

export function ToolInterpretation({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded border border-accent-border bg-accent-subtle p-4">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-fg-3">Analysis</p>
      <p className="text-sm leading-6 text-fg-2">{children}</p>
    </div>
  );
}

export function StatGrid({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map(stat => (
        <div key={stat.label} className="rounded border border-border bg-bg-2 p-3">
          <dt className="font-mono text-[10px] uppercase tracking-wider text-fg-3">{stat.label}</dt>
          <dd className="mt-1 text-lg font-medium text-fg">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
