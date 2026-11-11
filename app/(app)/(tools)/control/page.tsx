"use client";

import { useState } from "react";
import { computeControlChart } from "@/lib/stats/control";
import { formatStat } from "@/lib/stats/descriptive";
import ControlChart from "@/components/charts/ControlChart";
import { StatGrid, ToolActions, ToolError, ToolInterpretation, ToolPageLayout, ToolReportCapture } from "@/components/tool/ToolPageLayout";
import { useToolStore } from "@/store/tools";

type ControlResult = NonNullable<ReturnType<typeof computeControlChart>>;

export default function ControlPage() {
  const [data, setData] = useState("");
  const [result, setResult] = useState<ControlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateTool = useToolStore(state => state.updateTool);

  const generate = (input: string) => {
    setError(null);
    const subgroups = input.split("\n").map(line => line.trim()).filter(Boolean)
      .map(line => line.split(/[\s,;]+/).map(Number).filter(value => !Number.isNaN(value)))
      .filter(group => group.length >= 2);
    const computed = computeControlChart(subgroups);
    if (!computed) {
      setResult(null);
      setError("Enter 2+ subgroups with 2+ samples each.");
      updateTool("control", null, false);
      return;
    }
    setResult(computed);
    updateTool("control", {
      title: "Control Chart (X̄ & R)",
      keySummary: `n/subgroup=${computed.sampleSize}${computed.sameSize ? "" : " (uneven)"}, subgroups=${subgroups.length}, X̄̄=${formatStat(computed.xbarbar)}, R̄=${formatStat(computed.rbar)}, UCLx=${formatStat(computed.uclX)}, LCLx=${formatStat(computed.lclX)}, flagged=${computed.flaggedCount}`,
      interpretation: computed.interpretation,
    }, true);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    generate(data);
  };

  const loadExample = () => {
    const example = "10.1, 10.3, 9.9, 10.2\n10.4, 10.0, 10.2, 10.1\n9.8, 10.1, 10.0, 10.2\n10.3, 9.9, 10.1, 10.0\n10.0, 10.2, 10.1, 10.3\n10.1, 10.0, 10.2, 9.9\n10.5, 10.6, 10.4, 10.7\n10.2, 10.1, 10.3, 10.0";
    setData(example);
    generate(example);
  };

  const clear = () => {
    setData("");
    setResult(null);
    setError(null);
    updateTool("control", null, false);
  };

  return (
    <ToolPageLayout
      title="Control Chart — X̄ & R"
      description="Subgroup size n = 2–10 using standard SPC constants. Western Electric run rules applied automatically."
      resultTitle="X̄ & R charts"
      input={
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-fg-2" htmlFor="cc-data">Data <span className="text-fg-4">one subgroup per line</span></label>
          <textarea id="cc-data" value={data} onChange={event => setData(event.target.value)} className="min-h-52 w-full rounded border border-border bg-bg-2 p-3 font-mono text-sm" placeholder={"10.1, 10.3, 9.9\n10.4, 10.0, 10.2\n9.8, 10.1, 10.0"} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white">Generate control charts</button>
            <ToolActions onExample={loadExample} onClear={clear} />
          </div>
        </form>
      }
      result={
        <>
          <ToolError>{error}</ToolError>
          {result ? (
            <ToolReportCapture toolId="control" captureKey={result}>
            <>
              <ControlChart data={result.means} ucl={result.uclX} lcl={result.lclX} cl={result.xbarbar} label="X̄ chart — subgroup means" flagged={result.flagged} />
              <ControlChart data={result.ranges} ucl={result.uclR} lcl={result.lclR} cl={result.rbar} label="R chart — subgroup ranges" flagged={result.outR} />
              <StatGrid stats={[
                { label: "X̄̄ (CL)", value: formatStat(result.xbarbar) },
                { label: "R̄", value: formatStat(result.rbar) },
                { label: "σ̂ (X̄)", value: formatStat(result.sigmaX) },
                { label: "UCL / LCL X̄", value: `${formatStat(result.uclX, 2)} / ${formatStat(result.lclX, 2)}` },
                { label: "UCL R", value: formatStat(result.uclR) },
                { label: "Flagged", value: String(result.flaggedCount) },
              ]} />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-border text-fg-3"><th className="p-2">Subgroup</th><th className="p-2 text-right">Mean</th><th className="p-2 text-right">Range</th><th className="p-2">Status</th></tr></thead>
                  <tbody>{result.subgroups.map((_, index) => {
                    const flagged = result.flagged[index] || result.outR[index];
                    return <tr key={index} className="border-b border-border">
                      <td className="p-2">SG{index + 1}</td>
                      <td className="p-2 text-right">{formatStat(result.means[index])}</td>
                      <td className="p-2 text-right">{formatStat(result.ranges[index])}</td>
                      <td className={`p-2 ${flagged ? "text-warn" : "text-ok"}`}>{flagged ? "Flagged" : "In control"}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
              <ToolInterpretation>{result.interpretation}</ToolInterpretation>
            </>
            </ToolReportCapture>
          ) : <p className="py-16 text-center text-sm text-fg-3">Enter 2 or more subgroups</p>}
        </>
      }
    />
  );
}
