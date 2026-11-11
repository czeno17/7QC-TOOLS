"use client";

import { useState } from "react";
import { computeCheckSheet } from "@/lib/parse/checksheet";
import { formatStat } from "@/lib/stats/descriptive";
import { useToolStore } from "@/store/tools";
import { CheckSheetChart } from "@/components/charts/CheckSheetChart";
import { StatGrid, ToolActions, ToolError, ToolInterpretation, ToolPageLayout, ToolReportCapture } from "@/components/tool/ToolPageLayout";

export default function ChecksheetPage() {
  const [types, setTypes] = useState("");
  const [data, setData] = useState("");
  const [result, setResult] = useState<ReturnType<typeof computeCheckSheet> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateTool = useToolStore(state => state.updateTool);

  const generate = (inputTypes: string, inputData: string) => {
    setError(null);
    const typeArray = inputTypes.split(",").map(t => t.trim());
    const dataArray = inputData.split(/[,;\n]+/).map(d => d.trim()).filter(Boolean);
    if (!typeArray.some(Boolean) || !dataArray.length) {
      setResult(null);
      setError("Provide defect types and raw data.");
      updateTool("checksheet", null, false);
      return;
    }
    const computed = computeCheckSheet(typeArray, dataArray);
    setResult(computed);
    updateTool("checksheet", {
      title: "Check Sheet",
      keySummary: `Defect types: ${computed.types.join(", ")}\nTotal tallied: ${computed.total}${computed.unmatched ? ` (+${computed.unmatched} unclassified)` : ""}`,
      interpretation: computed.interpretation,
    }, true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(types, data);
  };

  const loadExample = () => {
    const exampleTypes = "Scratch, Dent, Crack, Burr, Discoloration";
    const exampleData = "Scratch, Scratch, Dent, Crack, Scratch, Burr, Dent, Scratch, Scratch, Discoloration, Dent, Scratch, Burr, Scratch, Crack, Dent, Scratch, Scratch, Burr, Dent, Scratch, Scratch, Discoloration, Dent, Crack, Scratch, Scratch, Scratch, Dent, Burr";
    setTypes(exampleTypes);
    setData(exampleData);
    generate(exampleTypes, exampleData);
  };

  const clear = () => {
    setTypes("");
    setData("");
    setResult(null);
    setError(null);
    updateTool("checksheet", null, false);
  };

  return (
    <ToolPageLayout
      title="Check Sheet"
      description="Declare defect categories, then paste raw occurrence data. Frequency is tallied and charted."
      resultTitle="Frequency"
      input={
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-fg-2" htmlFor="cs-types">Defect types <span className="text-fg-4">comma-separated</span></label>
          <input id="cs-types" value={types} onChange={event => setTypes(event.target.value)} className="w-full rounded border border-border bg-bg-2 p-2" placeholder="Scratch, Dent, Crack, Burr" />
          <label className="block text-sm text-fg-2" htmlFor="cs-data">Raw observations <span className="text-fg-4">comma / line</span></label>
          <textarea id="cs-data" value={data} onChange={event => setData(event.target.value)} className="min-h-40 w-full rounded border border-border bg-bg-2 p-3 font-mono text-sm" placeholder="Scratch, Scratch, Dent, Crack, Scratch, Burr, Dent" />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded bg-accent px-4 py-2 text-sm text-white">Generate tally</button>
            <ToolActions onExample={loadExample} onClear={clear} />
          </div>
        </form>
      }
      result={
        <>
          <ToolError>{error}</ToolError>
          {result ? (
            <ToolReportCapture toolId="checksheet" captureKey={result}>
            <>
              <CheckSheetChart data={result.types.map(name => ({ name, value: result.tally[name] }))} />
              <StatGrid stats={[
                { label: "Defects tallied", value: String(result.total) },
                { label: "Defined types", value: String(result.types.length) },
                { label: "Unclassified", value: String(result.unmatched) },
              ]} />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-border text-fg-3"><th className="p-2">Defect type</th><th className="p-2 text-right">Count</th><th className="p-2 text-right">% total</th></tr></thead>
                  <tbody>
                    {result.types.map(type => <tr key={type} className="border-b border-border"><td className="p-2">{type}</td><td className="p-2 text-right">{result.tally[type]}</td><td className="p-2 text-right">{result.total ? formatStat((result.tally[type] / result.total) * 100, 1) : "0"}%</td></tr>)}
                    {result.unmatched > 0 && <tr><td className="p-2">Unclassified</td><td className="p-2 text-right">{result.unmatched}</td><td className="p-2 text-right">{formatStat((result.unmatched / (result.total + result.unmatched)) * 100, 1)}%</td></tr>}
                  </tbody>
                </table>
              </div>
              <ToolInterpretation>{result.interpretation}</ToolInterpretation>
            </>
            </ToolReportCapture>
          ) : <p className="py-16 text-center text-sm text-fg-3">Provide defect types and raw data</p>}
        </>
      }
    />
  );
}
