"use client";

import { useMemo, useState } from "react";
import { TOOL_REGISTRY } from "@/lib/tools/navigation";
import { useToolStore } from "@/store/tools";

const TOOL_ORDER = TOOL_REGISTRY.map(({ id, name }) => [id, name] as const);

type ToolFinding = {
  title: string;
  keySummary: string;
  interpretation: string;
  chartSvgs?: string[];
  tableHtmls?: string[];
};

const TOOL_METHODS: Record<string, string> = Object.fromEntries(
  TOOL_REGISTRY.map(tool => [tool.id, tool.reportMethod]),
);

function isToolFinding(value: unknown): value is ToolFinding {
  if (!value || typeof value !== "object") return false;
  const finding = value as Record<string, unknown>;
  return typeof finding.title === "string"
    && typeof finding.keySummary === "string"
    && typeof finding.interpretation === "string"
    && (finding.chartSvgs === undefined || (Array.isArray(finding.chartSvgs) && finding.chartSvgs.every(svg => typeof svg === "string")))
    && (finding.tableHtmls === undefined || (Array.isArray(finding.tableHtmls) && finding.tableHtmls.every(table => typeof table === "string")));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export default function ReportPage() {
  const tools = useToolStore(state => state.tools);
  const findings = useMemo(() => TOOL_ORDER
    .map(([id, label]) => {
      const state = tools[id];
      return state?.done && isToolFinding(state.data) ? { id, label, ...state.data } : null;
    })
    .filter((finding): finding is NonNullable<typeof finding> => finding !== null), [tools]);
  const missing = TOOL_ORDER.filter(([id]) => !findings.some(finding => finding.id === id)).map(([, label]) => label);

  const [title, setTitle] = useState("");
  const [process, setProcess] = useState("");
  const [revision, setRevision] = useState("1.0");
  const [status, setStatus] = useState("Draft");
  const [reportNo, setReportNo] = useState("");
  const [author, setAuthor] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [approver, setApprover] = useState("");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [compiledAt, setCompiledAt] = useState<Date | null>(null);

  const outputTitle = title.trim() || "Untitled Investigation";
  const compiledDate = compiledAt?.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) ?? "";
  const executiveText = executiveSummary.trim()
    ? executiveSummary
    : findings.length
      ? findings.map(finding => `${finding.label}: ${finding.interpretation}`).join("\n")
      : "No tools generated yet — run at least one tool to populate this summary.";

  const compile = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const nextReportNo = reportNo || `QR-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
    setReportNo(nextReportNo);
    setCompiledAt(now);
    return { now, reportNo: nextReportNo };
  };

  const download = () => {
    const compiled = compile();
    const sections = findings.map((finding, index) => `
      <section>
        <p class="sub">Section ${index + 2} · Tool ${String(TOOL_ORDER.findIndex(([id]) => id === finding.id) + 1).padStart(2, "0")}</p>
        <h2>${index + 2}. ${escapeHtml(finding.label)}</h2>
        <p class="method">Method — ${escapeHtml(TOOL_METHODS[finding.id])}</p>
        ${finding.chartSvgs?.length
          ? finding.chartSvgs.map((svg, figureIndex) => `<figure>${svg}<figcaption>Figure ${figureIndex + 1} — ${escapeHtml(finding.label)}</figcaption></figure>`).join("")
          : '<p class="note">Chart image unavailable — reopen the tool and regenerate.</p>'}
        ${finding.tableHtmls?.length ? `<h3>Supporting data</h3>${finding.tableHtmls.join("")}` : ""}
        <h3>Key inputs / values</h3><pre>${escapeHtml(finding.keySummary)}</pre>
        <p><strong>Analysis:</strong> ${escapeHtml(finding.interpretation)}</p>
      </section>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(outputTitle)}</title>
      <style>body{font:14px/1.6 Arial,sans-serif;color:#222;max-width:900px;margin:40px auto;padding:0 24px}h1{font-size:28px}h2{border-bottom:1px solid #ccc;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{border:1px solid #ccc;padding:8px;text-align:left}.key{font-weight:bold;background:#f3f3f3;width:150px}pre{white-space:pre-wrap;background:#f5f5f5;padding:12px}.sub,.method{color:#777}.sub{text-transform:uppercase;font-size:11px;letter-spacing:.1em}figure{margin:20px 0;page-break-inside:avoid;break-inside:avoid}figure svg{display:block;width:100%;height:auto;max-height:none;overflow:visible}figcaption,.note{color:#777;font-size:12px}section{margin:28px 0;page-break-inside:avoid}.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:45px}.signatures div{border-top:1px solid #777;padding-top:8px}@media print{body{margin:0 auto}figure svg{width:100%;height:auto;max-height:none}}</style></head><body>
      <p>Quality Management System · Audit Record</p><h1>${escapeHtml(outputTitle)}</h1>
      <p>${escapeHtml(process)} · Compiled ${escapeHtml(compiled.now.toLocaleString())}</p>
      <table><tr><td class="key">Report No.</td><td>${escapeHtml(compiled.reportNo)}</td><td class="key">Revision</td><td>${escapeHtml(revision)}</td></tr>
      <tr><td class="key">Status</td><td>${escapeHtml(status)}</td><td class="key">Date issued</td><td>${escapeHtml(compiled.now.toLocaleDateString())}</td></tr>
      <tr><td class="key">Process / product</td><td colspan="3">${escapeHtml(process || "—")}</td></tr>
      <tr><td class="key">Prepared by</td><td>${escapeHtml(author || "—")}</td><td class="key">Reviewed by</td><td>${escapeHtml(reviewer || "—")}</td></tr></table>
      <h2>1. Executive Summary</h2><pre>${escapeHtml(executiveText)}</pre>
      <h2>Table of contents</h2><ol><li>Executive Summary</li>${findings.map(finding => `<li>${escapeHtml(finding.label)}</li>`).join("")}${conclusion ? "<li>Conclusion &amp; Recommendations</li>" : ""}</ol>
      ${sections}
      ${conclusion ? `<section><p class="sub">Conclusion &amp; Recommendations</p><h2>Conclusion &amp; Recommendations</h2><pre>${escapeHtml(conclusion)}</pre></section>` : ""}
      <h2>Approval &amp; Sign-off</h2><div class="signatures"><div>Prepared by: ${escapeHtml(author || "—")}<br>Signature / Date</div><div>Reviewed by: ${escapeHtml(reviewer || "—")}<br>Signature / Date</div><div>Approved by: ${escapeHtml(approver || "—")}<br>Signature / Date</div></div>
      <p>Generated by QC Toolkit v1.0 · Verify independently before formal corrective-action use</p></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quality-report.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-360 space-y-6 p-5 sm:p-8">
      <header>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-4">Output / Compile & Export</p>
        <h1 className="text-2xl font-semibold">Report Dashboard</h1>
        <p className="mt-2 text-sm text-fg-2">Consolidates generated charts and analyses from every tool into a printable audit document.</p>
      </header>

      <section className="rounded-lg border border-border bg-bg-1">
        <div className="border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Document control</h2></div>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-fg-2">Project / Problem title<input value={title} onChange={event => setTitle(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="Weld Porosity Root Cause Investigation — Line 4" /></label>
            <label className="text-sm text-fg-2">Process / product reference<input value={process} onChange={event => setProcess(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="Line 4 — MIG Weld Station 2" /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm text-fg-2">Revision<input value={revision} onChange={event => setRevision(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" /></label>
            <label className="text-sm text-fg-2">Status<select value={status} onChange={event => setStatus(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2"><option>Draft</option><option>Under Review</option><option>Final — Approved</option></select></label>
            <label className="text-sm text-fg-2">Report No.<input value={reportNo} readOnly className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="Auto-generated" /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm text-fg-2">Prepared by<input value={author} onChange={event => setAuthor(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="Name, Position" /></label>
            <label className="text-sm text-fg-2">Reviewed by<input value={reviewer} onChange={event => setReviewer(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="Name, Position" /></label>
            <label className="text-sm text-fg-2">Approved by<input value={approver} onChange={event => setApprover(event.target.value)} className="mt-1 w-full rounded border border-border bg-bg-2 p-2" placeholder="Name, Position" /></label>
          </div>
          <label className="block text-sm text-fg-2">Executive summary <span className="text-fg-4">optional — auto-drafted if blank</span><textarea value={executiveSummary} onChange={event => setExecutiveSummary(event.target.value)} className="mt-1 min-h-24 w-full rounded border border-border bg-bg-2 p-2" placeholder="Leave blank to auto-generate from each tool's analysis..." /></label>
          <label className="block text-sm text-fg-2">Conclusion &amp; recommendations<textarea value={conclusion} onChange={event => setConclusion(event.target.value)} className="mt-1 min-h-28 w-full rounded border border-border bg-bg-2 p-2" placeholder="Summarize root cause findings and the corrective actions recommended..." /></label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={compile} className="rounded bg-accent px-4 py-2 text-sm text-white">Compile report</button>
            <button type="button" onClick={() => window.print()} className="rounded border border-border px-4 py-2 text-sm">Print / Save PDF</button>
            <button type="button" onClick={download} className="rounded border border-border px-4 py-2 text-sm">Download .html</button>
          </div>
        </div>
      </section>

      <article className="rounded-lg border border-border bg-bg-1 p-6 sm:p-10 print:border-0 print:bg-white print:text-black">
        <header className="border-b border-border pb-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-fg-3">Quality Management System · Audit Record</p>
          <h2 className="mt-3 text-3xl font-semibold">{outputTitle}</h2>
          <p className="mt-2 text-sm text-fg-3">{process ? `${process} · ` : ""}{compiledAt ? `Compiled ${compiledAt.toLocaleString()}` : "Not compiled"}</p>
        </header>
        <table className="my-6 w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-border"><th className="p-2 text-left">Report No.</th><td className="p-2">{reportNo || "—"}</td><th className="p-2 text-left">Revision</th><td className="p-2">{revision}</td></tr>
            <tr className="border-b border-border"><th className="p-2 text-left">Status</th><td className="p-2">{status}</td><th className="p-2 text-left">Date issued</th><td className="p-2">{compiledDate || "—"}</td></tr>
            <tr className="border-b border-border"><th className="p-2 text-left">Process / product</th><td className="p-2" colSpan={3}>{process || "—"}</td></tr>
            <tr className="border-b border-border"><th className="p-2 text-left">Prepared by</th><td className="p-2">{author || "—"}</td><th className="p-2 text-left">Reviewed by</th><td className="p-2">{reviewer || "—"}</td></tr>
          </tbody>
        </table>
        <nav className="mb-6 rounded border border-border p-4">
          <h3 className="mb-2 font-semibold">Table of contents</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-fg-2">
            <li><a href="#report-executive" className="hover:text-fg">Executive Summary</a></li>
            {findings.map((finding, index) => <li key={finding.id}><a href={`#report-${finding.id}`} className="hover:text-fg">{finding.label} (Section {index + 2})</a></li>)}
            {conclusion && <li><a href="#report-conclusion" className="hover:text-fg">Conclusion &amp; Recommendations</a></li>}
          </ol>
        </nav>
        <section id="report-executive" className="border-b border-border py-5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-fg-3">Section 1</p>
          <h3 className="mb-3 text-lg font-semibold">Executive Summary</h3>
          <p className="whitespace-pre-wrap text-sm leading-6 text-fg-2">{executiveText}</p>
        </section>
        {findings.map((finding, index) => (
          <section id={`report-${finding.id}`} key={finding.id} className="border-b border-border py-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-fg-3">Section {index + 2} · Tool {String(TOOL_ORDER.findIndex(([id]) => id === finding.id) + 1).padStart(2, "0")}</p>
            <h3 className="my-2 text-lg font-semibold">{index + 2}. {finding.label}</h3>
            <p className="mb-2 text-xs text-fg-3">Method — {TOOL_METHODS[finding.id]}</p>
            {finding.chartSvgs?.map((svg, figureIndex) => (
              <figure key={figureIndex} className="my-4 rounded border border-border bg-bg-2 p-3 print:break-inside-avoid">
                <div className="report-chart" dangerouslySetInnerHTML={{ __html: svg }} />
                <figcaption className="mt-2 text-xs text-fg-3">Figure {figureIndex + 1} — {finding.label}</figcaption>
              </figure>
            ))}
            {finding.tableHtmls?.map((table, tableIndex) => (
              <div key={tableIndex} className="report-table my-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: table }} />
            ))}
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-3">Key inputs / values</p>
            <pre className="whitespace-pre-wrap rounded bg-bg-2 p-3 font-mono text-xs text-fg-2">{finding.keySummary}</pre>
            <p className="mt-3 text-sm leading-6 text-fg-2"><strong>Analysis:</strong> {finding.interpretation}</p>
          </section>
        ))}
        {missing.length > 0 && <p className="mt-4 rounded border border-border p-3 text-sm text-fg-3">Not yet generated: {missing.join(", ")}</p>}
        {!findings.length && <p className="mt-4 rounded border border-border p-3 text-sm text-fg-3">No tools generated yet. Visit each tool and click Generate, then return here and compile.</p>}
        {conclusion && <section id="report-conclusion" className="border-b border-border py-5"><p className="font-mono text-[10px] uppercase tracking-wider text-fg-3">Conclusion &amp; Recommendations</p><h3 className="my-2 text-lg font-semibold">Conclusion &amp; Recommendations</h3><p className="whitespace-pre-wrap text-sm leading-6 text-fg-2">{conclusion}</p></section>}
        <footer className="pt-6">
          <h3 className="font-semibold">Approval &amp; Sign-off</h3>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[["Prepared by", author], ["Reviewed by", reviewer], ["Approved by", approver]].map(([label, name]) => <div key={label} className="border-t border-border pt-2 text-sm"><p>{label}: {name || "—"}</p><p className="mt-4 text-xs text-fg-3">Signature / Date</p></div>)}
          </div>
          <p className="mt-8 text-xs text-fg-4">Generated by QC Toolkit v1.0 · Verify independently before formal corrective-action use</p>
        </footer>
      </article>
    </main>
  );
}
