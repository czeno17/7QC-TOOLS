"use client";

import { useState } from "react";
import { FishboneChart } from "@/components/charts/FishboneChart";
import { summarizeFishbone, type FishboneCategory } from "@/lib/stats/fishbone";
import { StatGrid, ToolActions, ToolInterpretation, ToolPageLayout, ToolReportCapture } from "@/components/tool/ToolPageLayout";
import { useToolStore } from "@/store/tools";

const CATEGORIES = ["Machine", "Man", "Method", "Material", "Measurement", "Environment"];

export default function FishbonePage() {
  const [effect, setEffect] = useState("");
  const [causes, setCauses] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map(c => [c, ""]))
  );
  const [result, setResult] = useState<ReturnType<typeof summarizeFishbone> | null>(null);
  const updateTool = useToolStore(state => state.updateTool);

  const generate = (inputEffect: string, inputCauses: Record<string, string>) => {
    const categories: FishboneCategory[] = CATEGORIES.map(name => ({
      name,
      causes: inputCauses[name].split("\n").map(cause => cause.trim()).filter(Boolean),
    }));
    const summary = summarizeFishbone(inputEffect, categories);
    if (!summary.totalCauses) {
      setResult(null);
      updateTool("fishbone", null, false);
      return;
    }
    setResult(summary);
    updateTool("fishbone", {
      title: "Fishbone Diagram",
      keySummary: `Effect: ${summary.effect}\nCategories used: ${summary.categories.map(category => `${category.name} (${category.causes.length})`).join(", ")}`,
      interpretation: summary.interpretation,
    }, true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(effect, causes);
  };

  const loadExample = () => {
    const exampleEffect = "Excessive weld porosity on Line 4";
    const exampleCauses = {
      Man: "Insufficient operator training\nShift handover gaps",
      Machine: "Wire feed speed drift\nTorch angle variance\nGas flow regulator fault",
      Method: "No pre-weld purge procedure\nWeld parameter sheet outdated",
      Material: "Contaminated filler wire\nMoisture in shielding gas",
      Measurement: "Gauge calibration overdue",
      Environment: "Humidity above spec\nDraft from bay door"
    };
    setEffect(exampleEffect);
    setCauses(exampleCauses);
    generate(exampleEffect, exampleCauses);
  };

  const clear = () => {
    setEffect("");
    setCauses(Object.fromEntries(CATEGORIES.map(c => [c, ""])));
    setResult(null);
    updateTool("fishbone", null, false);
  };

  return (
    <ToolPageLayout
      title="Fishbone Diagram"
      description="Define the problem effect, then list candidate causes under each contributing category."
      resultTitle="Diagram"
      input={<form onSubmit={onSubmit}>
        <section className="space-y-4">
          <label className="mb-1 block text-sm text-fg-2" htmlFor="fb-effect">Problem / Effect</label>
          <input id="fb-effect" value={effect} onChange={e => setEffect(e.target.value)} className="w-full rounded border border-border bg-bg-2 p-2" placeholder="e.g. Excessive weld porosity" />
          <h3 className="text-sm font-medium text-fg-2">Cause categories <span className="text-fg-4">6M</span></h3>
          <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <label htmlFor={`fb-${cat.toLowerCase()}`} className="block text-sm font-medium text-fg-2">{cat}</label>
              <textarea id={`fb-${cat.toLowerCase()}`} value={causes[cat]} onChange={e => setCauses({...causes, [cat]: e.target.value})} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" rows={3} placeholder="One cause per line" />
            </div>
          ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" className="rounded bg-accent px-4 py-2 text-white">Generate diagram</button>
            <ToolActions onExample={loadExample} onClear={clear} />
          </div>
        </section>
      </form>}
      result={result ? (
        <ToolReportCapture toolId="fishbone" captureKey={result}>
        <>
          <FishboneChart effect={result.effect} categories={result.categories} />
          <StatGrid stats={[
            { label: "Candidate causes", value: String(result.totalCauses) },
            { label: "Categories used", value: String(result.categories.length) },
          ]} />
          <ToolInterpretation>{result.interpretation}</ToolInterpretation>
        </>
        </ToolReportCapture>
      ) : (
        <div className="flex min-h-72 items-center justify-center rounded border border-border text-center text-sm text-fg-3">
          <div><strong className="block text-fg-2">No diagram yet</strong>Add at least one cause under a category</div>
        </div>
      )}
    />
  );
}