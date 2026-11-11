"use client";

import { useState } from "react";
import { ScatterInputSchema } from "@/lib/parse/scatter";
import { correlationCoefficient } from "@/lib/stats/correlation";
import { formatStat } from "@/lib/stats/descriptive";
import { linearRegression } from "@/lib/stats/regression";
import ScatterChart from "@/components/charts/ScatterChart";
import { StatGrid, ToolActions, ToolError, ToolInterpretation, ToolPageLayout, ToolReportCapture } from "@/components/tool/ToolPageLayout";
import { useToolStore } from "@/store/tools";

type ScatterResult = {
  points: { x: number; y: number }[];
  xLabel: string;
  yLabel: string;
  r: number;
  slope: number;
  intercept: number;
  equation: string;
  interpretation: string;
};

export default function ScatterPage() {
  const [xLabel, setXLabel] = useState("");
  const [yLabel, setYLabel] = useState("");
  const [data, setData] = useState("");
  const [result, setResult] = useState<ScatterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateTool = useToolStore(state => state.updateTool);

  const generate = (inputXLabel: string, inputYLabel: string, inputData: string) => {
    setError(null);
    const parsed = ScatterInputSchema.safeParse(inputData);
    if (!parsed.success) {
      setResult(null);
      setError(parsed.error.issues[0]?.message ?? "Enter valid paired measurements.");
      updateTool("scatter", null, false);
      return;
    }
    const points = parsed.data;
    if (points.length < 3) {
      setResult(null);
      setError('Enter at least 3 "x, y" pairs');
      updateTool("scatter", null, false);
      return;
    }

    const xlabel = inputXLabel || "X";
    const ylabel = inputYLabel || "Y";
    const r = correlationCoefficient(points);
    const { slope, intercept } = linearRegression(points);
    const equation = `${ylabel} = ${formatStat(slope, 4)}·${xlabel}${intercept >= 0 ? " + " : " − "}${formatStat(Math.abs(intercept), 3)}`;
    const absR = Math.abs(r);
    const strength = absR >= 0.8 ? "very strong" : absR >= 0.6 ? "strong" : absR >= 0.4 ? "moderate" : absR >= 0.2 ? "weak" : "negligible";
    const direction = r >= 0 ? "positive" : "negative";
    const interpretation = absR < 0.2
      ? `r = ${formatStat(r)} — essentially no linear relationship between ${xlabel} and ${ylabel}. Other factors likely dominate.`
      : `r = ${formatStat(r)} indicates a ${strength} ${direction} correlation between ${xlabel} and ${ylabel}${absR >= 0.6 ? " — worth investigating as a likely driver." : "."}`;
    const computed = { points, xLabel: xlabel, yLabel: ylabel, r, slope, intercept, equation, interpretation };
    setResult(computed);
    updateTool("scatter", {
      title: "Scatter Diagram",
      keySummary: `${xlabel} vs ${ylabel}, n=${points.length}, r=${formatStat(r)}, ${equation}`,
      interpretation,
    }, true);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    generate(xLabel, yLabel, data);
  };

  const loadExample = () => {
    const exampleData = "180, 12\n200, 9\n220, 7\n240, 5\n260, 4\n280, 3\n300, 2\n320, 4\n340, 6\n360, 10";
    setXLabel("Wire feed speed (ipm)");
    setYLabel("Porosity count");
    setData(exampleData);
    generate("Wire feed speed (ipm)", "Porosity count", exampleData);
  };

  const clear = () => {
    setXLabel("");
    setYLabel("");
    setData("");
    setResult(null);
    setError(null);
    updateTool("scatter", null, false);
  };

  return (
    <ToolPageLayout
      title="Scatter Diagram"
      description="Paste paired X, Y values — one pair per line. Pearson's r and a fitted regression line are computed."
      resultTitle="Relationship"
      input={
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-fg-2" htmlFor="sc-xlabel">X label<input id="sc-xlabel" value={xLabel} onChange={event => setXLabel(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="RPM" /></label>
            <label className="block text-sm text-fg-2" htmlFor="sc-ylabel">Y label<input id="sc-ylabel" value={yLabel} onChange={event => setYLabel(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="Temperature" /></label>
          </div>
          <label className="block text-sm text-fg-2" htmlFor="sc-data">Pairs <span className="text-fg-4">x, y per line</span></label>
          <textarea id="sc-data" value={data} onChange={event => setData(event.target.value)} className="min-h-40 w-full rounded border border-border bg-bg-2 p-3 font-mono text-sm" placeholder={"1200, 65\n1400, 70\n1600, 74"} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white">Generate scatter</button>
            <ToolActions onExample={loadExample} onClear={clear} />
          </div>
        </form>
      }
      result={
        <>
          <ToolError>{error}</ToolError>
          {result ? (
            <ToolReportCapture toolId="scatter" captureKey={result}>
            <>
              <ScatterChart points={result.points} regression={result} xLabel={result.xLabel} yLabel={result.yLabel} />
              <StatGrid stats={[
                { label: "r value", value: formatStat(result.r) },
                { label: "n pairs", value: String(result.points.length) },
                { label: "r²", value: formatStat(result.r * result.r) },
                { label: "Regression", value: result.equation },
              ]} />
              <ToolInterpretation>{result.interpretation}</ToolInterpretation>
            </>
            </ToolReportCapture>
          ) : <p className="py-16 text-center text-sm text-fg-3">Enter at least 3 paired measurements</p>}
        </>
      }
    />
  );
}
