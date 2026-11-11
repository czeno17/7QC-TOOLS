"use client";

import { useState } from "react";
import { computeStratification } from "@/lib/parse/strat";
import { formatStat } from "@/lib/stats/descriptive";
import { summarizeStratification } from "@/lib/stats/stratification";
import { StratificationChart } from "@/components/charts/StratificationChart";
import { StatGrid, ToolActions, ToolError, ToolInterpretation, ToolPageLayout, ToolReportCapture } from "@/components/tool/ToolPageLayout";
import { useToolStore } from "@/store/tools";

type StratificationResult = ReturnType<typeof summarizeStratification>;

export default function StratificationPage() {
  const [data, setData] = useState("");
  const [result, setResult] = useState<StratificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateTool = useToolStore(state => state.updateTool);

  const generate = (input: string) => {
    setError(null);
    const groups = computeStratification(input);
    if (groups.length < 2) {
      setResult(null);
      setError('Provide 2+ groups: "Label: v1, v2, v3"');
      updateTool("strat", null, false);
      return;
    }
    const computed = summarizeStratification(groups);
    setResult(computed);
    updateTool("strat", {
      title: "Stratification",
      keySummary: computed.groups.map(group => `${group.name}: n=${group.values.length}, mean=${formatStat(group.mean)}, sd=${formatStat(group.sd)}`).join("\n"),
      interpretation: computed.interpretation,
    }, true);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    generate(data);
  };

  const loadExample = () => {
    const example = "Shift 1: 5.1, 4.8, 5.0, 4.9, 5.2, 4.7\nShift 2: 6.5, 7.1, 6.8, 6.9, 7.0, 6.6\nShift 3: 5.4, 5.2, 5.5, 5.3, 5.1, 5.6";
    setData(example);
    generate(example);
  };

  const clear = () => {
    setData("");
    setResult(null);
    setError(null);
    updateTool("strat", null, false);
  };

  return (
    <ToolPageLayout
      title="Stratification"
      description="Group data by a stratifying variable — shift, machine, operator — to surface where variation lives."
      resultTitle="Box plot comparison"
      input={
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-fg-2" htmlFor="st-data">Groups <span className="text-fg-4">Label: v1, v2, v3</span></label>
          <textarea id="st-data" value={data} onChange={event => setData(event.target.value)} className="min-h-44 w-full rounded border border-border bg-bg-2 p-3 font-mono text-sm" placeholder={"Shift 1: 5.1, 4.8, 5.0, 4.9\nShift 2: 6.5, 7.1, 6.8, 6.9\nShift 3: 5.4, 5.2, 5.5, 5.3"} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white">Generate comparison</button>
            <ToolActions onExample={loadExample} onClear={clear} />
          </div>
        </form>
      }
      result={
        <>
          <ToolError>{error}</ToolError>
          {result ? (
            <ToolReportCapture toolId="strat" captureKey={result}>
            <>
              <StratificationChart groups={result.groups} />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-border text-fg-3"><th className="p-2">Group</th><th className="p-2 text-right">N</th><th className="p-2 text-right">Mean</th><th className="p-2 text-right">Std dev</th><th className="p-2 text-right">Min</th><th className="p-2 text-right">Max</th></tr></thead>
                  <tbody>{result.groups.map(group => <tr key={group.name} className="border-b border-border">
                    <td className="p-2">{group.name}</td><td className="p-2 text-right">{group.values.length}</td><td className="p-2 text-right">{formatStat(group.mean)}</td><td className="p-2 text-right">{formatStat(group.sd)}</td><td className="p-2 text-right">{formatStat(group.summary.min)}</td><td className="p-2 text-right">{formatStat(group.summary.max)}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <StatGrid stats={[
                { label: "Groups", value: String(result.groups.length) },
                { label: "Highest mean", value: result.groups.slice().sort((a, b) => b.mean - a.mean)[0].name },
                { label: "Widest spread", value: result.groups.slice().sort((a, b) => b.sd - a.sd)[0].name },
              ]} />
              <ToolInterpretation>{result.interpretation}</ToolInterpretation>
            </>
            </ToolReportCapture>
          ) : <p className="py-16 text-center text-sm text-fg-3">Provide 2 or more groups</p>}
        </>
      }
    />
  );
}
