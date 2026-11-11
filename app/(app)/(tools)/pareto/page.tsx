"use client";

import { useState } from "react";
import { ParetoInputSchema } from "@/lib/parse/pareto";
import { computePareto } from "@/lib/stats/pareto";
import type { ParetoResult } from "@/lib/parse/pareto";
import { ParetoChart } from "@/components/charts/ParetoChart";
import { StatGrid, ToolActions, ToolError, ToolInterpretation, ToolPageLayout, ToolReportCapture } from "@/components/tool/ToolPageLayout";
import { useToolStore } from "@/store/tools";

export default function ParetoPage() {
  const [result, setResult] = useState<ParetoResult | null>(null);
  const [data, setData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateTool = useToolStore(state => state.updateTool);

  const generate = (input: string) => {
    setError(null);
    const parsed = ParetoInputSchema.safeParse(input);
    if (!parsed.success) {
      setResult(null);
      setError(parsed.error.issues[0]?.message ?? "No valid data points found");
      updateTool("pareto", null, false);
      return;
    }
    const computed = computePareto(parsed.data);
    setResult(computed);
    updateTool("pareto", {
      title: "Pareto Chart",
      keySummary: `Categories: ${computed.items.map(item => `${item.name}=${item.value}`).join(", ")}`,
      interpretation: computed.interpretation,
    }, true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(data);
  };

  const loadExample = () => {
    const example = "Porosity: 47\nUndercut: 23\nSpatter: 12\nIncomplete fusion: 8\nCrack: 5\nOther: 3";
    setData(example);
    generate(example);
  };

  const clear = () => {
    setData("");
    setResult(null);
    setError(null);
    updateTool("pareto", null, false);
  };

  return (
    <ToolPageLayout
      title="Pareto Chart"
      description={'One category per line, formatted "Name: frequency". Vital few are highlighted; 80% reference line overlaid.'}
      resultTitle="80 / 20 breakdown"
      input={
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-fg-2" htmlFor="pareto-data">
            Data <span className="text-fg-4">one per line</span>
          </label>
          <textarea
            id="pareto-data"
            value={data}
            onChange={event => setData(event.target.value)}
            className="min-h-40 w-full rounded border border-border bg-bg-2 p-3 font-mono text-sm"
            placeholder={"Defect A: 50\nDefect B: 30\nDefect C: 12"}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white">Generate Pareto</button>
            <ToolActions onExample={loadExample} onClear={clear} />
          </div>
        </form>
      }
      result={
        <>
          <ToolError>{error}</ToolError>
          {result ? (
            <ToolReportCapture toolId="pareto" captureKey={result}>
            <>
              <ParetoChart {...result} />
              <StatGrid stats={[
                { label: "Total occurrences", value: String(result.total) },
                { label: "Categories", value: String(result.items.length) },
                { label: "Vital few", value: `${result.idx80 + 1} / ${result.items.length}` },
                { label: "At cutoff", value: `${result.cumPct[result.idx80] ?? 0}%` },
              ]} />
              <ToolInterpretation>{result.interpretation}</ToolInterpretation>
            </>
            </ToolReportCapture>
          ) : <p className="py-16 text-center text-sm text-fg-3">Enter categories and generate</p>}
        </>
      }
    />
  );
}
