"use client";

import { useState } from "react";
import { HistogramInputSchema } from "@/lib/parse/histogram";
import { formatStat } from "@/lib/stats/descriptive";
import { computeHistogram } from "@/lib/stats/histogram";
import HistogramChart from "@/components/charts/HistogramChart";
import { StatGrid, ToolActions, ToolError, ToolInterpretation, ToolPageLayout, ToolReportCapture } from "@/components/tool/ToolPageLayout";
import { useToolStore } from "@/store/tools";

type HistogramResult = ReturnType<typeof computeHistogram>;

export default function HistogramPage() {
  const [data, setData] = useState("");
  const [lsl, setLsl] = useState("");
  const [usl, setUsl] = useState("");
  const [result, setResult] = useState<HistogramResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateTool = useToolStore(state => state.updateTool);

  const generate = (inputData: string, inputLsl: string, inputUsl: string) => {
    setError(null);
    const parsed = HistogramInputSchema.safeParse(inputData);
    if (!parsed.success || parsed.data.length < 3) {
      setResult(null);
      setError(parsed.success ? "Enter at least 3 numeric measurements." : parsed.error.issues[0]?.message ?? "No valid numbers found.");
      updateTool("histogram", null, false);
      return;
    }

    const computed = computeHistogram(
      parsed.data,
      inputLsl.trim() ? Number(inputLsl) : undefined,
      inputUsl.trim() ? Number(inputUsl) : undefined,
    );
    setResult(computed);
    const { stats } = computed;
    updateTool("histogram", {
      title: "Histogram & Process Capability",
      keySummary: `N=${stats.n}, Mean=${formatStat(stats.mean)}, StdDev=${formatStat(stats.stdDev)}${inputLsl.trim() && inputUsl.trim() ? `, LSL=${inputLsl}, USL=${inputUsl}` : ""}${stats.cp !== null ? `, Cp=${formatStat(stats.cp, 2)}, Cpk=${stats.cpk === null ? "" : formatStat(stats.cpk, 2)}` : ""}`,
      interpretation: computed.interpretation,
    }, true);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    generate(data, lsl, usl);
  };

  const loadExample = () => {
    const example = "12.01, 11.98, 12.03, 12.00, 11.99, 12.02, 12.05, 11.97, 12.01, 12.00, 11.96, 12.04, 12.02, 11.99, 12.01, 12.03, 11.98, 12.00, 12.02, 12.01, 11.99, 12.05, 11.97, 12.00, 12.02, 12.01, 11.98, 12.03, 12.00, 11.99";
    setData(example);
    setLsl("11.90");
    setUsl("12.10");
    generate(example, "11.90", "12.10");
  };

  const clear = () => {
    setData("");
    setLsl("");
    setUsl("");
    setResult(null);
    setError(null);
    updateTool("histogram", null, false);
  };

  return (
    <ToolPageLayout
      title="Histogram & Process Capability"
      description="Paste raw measurements. Supply spec limits to compute Cp / Cpk and overlay a fitted normal curve."
      resultTitle="Distribution"
      input={
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-fg-2" htmlFor="hi-data">Data <span className="text-fg-4">comma / space / line</span></label>
          <textarea id="hi-data" value={data} onChange={event => setData(event.target.value)} className="min-h-40 w-full rounded border border-border bg-bg-2 p-3 font-mono text-sm" placeholder="12.01, 11.98, 12.03, 12.00, 11.99" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-fg-2" htmlFor="hi-lsl">LSL <span className="text-fg-4">optional</span><input id="hi-lsl" type="number" step="any" value={lsl} onChange={event => setLsl(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="11.90" /></label>
            <label className="block text-sm text-fg-2" htmlFor="hi-usl">USL <span className="text-fg-4">optional</span><input id="hi-usl" type="number" step="any" value={usl} onChange={event => setUsl(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="12.10" /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white">Generate histogram</button>
            <ToolActions onExample={loadExample} onClear={clear} />
          </div>
        </form>
      }
      result={
        <>
          <ToolError>{error}</ToolError>
          {result ? (
            <ToolReportCapture toolId="histogram" captureKey={result}>
            <>
              <HistogramChart bins={result.bins} curve={result.curve} yMax={result.yMax} lsl={lsl.trim() ? Number(lsl) : undefined} usl={usl.trim() ? Number(usl) : undefined} />
              <StatGrid stats={[
                { label: "Mean", value: formatStat(result.stats.mean) },
                { label: "Std dev", value: formatStat(result.stats.stdDev) },
                { label: "N", value: String(result.stats.n) },
                { label: "Range", value: formatStat(result.stats.range) },
                ...(result.stats.cp !== null ? [
                  { label: "Cp", value: formatStat(result.stats.cp, 2) },
                  { label: "Cpk", value: formatStat(result.stats.cpk!, 2) },
                ] : []),
              ]} />
              <ToolInterpretation>{result.interpretation}</ToolInterpretation>
            </>
            </ToolReportCapture>
          ) : <p className="py-16 text-center text-sm text-fg-3">Enter at least 3 numeric measurements</p>}
        </>
      }
    />
  );
}
