"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { TOOL_REGISTRY, type ToolId } from "@/lib/tools/navigation";
import { useToolStore, type ToolReportData } from "@/store/tools";

const subscribeToMount = () => () => {};
const getClientMountSnapshot = () => true;
const getServerMountSnapshot = () => false;

function exampleReportData() {
  return Object.fromEntries(TOOL_REGISTRY.map(tool => [
    tool.id,
    {
      title: tool.reportTitle,
      keySummary: `Legacy example inputs:\n${tool.exampleInput}`,
      interpretation: tool.exampleInterpretation,
    },
  ])) as Record<ToolId, ToolReportData>;
}

function useMounted() {
  return useSyncExternalStore(subscribeToMount, getClientMountSnapshot, getServerMountSnapshot);
}

export function ToolStatusPill({ toolId }: { toolId: ToolId }) {
  const mounted = useMounted();
  const toolState = useToolStore(state => state.tools[toolId]);

  if (!mounted) {
    return <span aria-hidden="true" className="inline-flex h-5 w-16 rounded-full bg-bg-3" />;
  }

  const status = toolState?.done && toolState.data
    ? toolState.inReport ? "In report" : "In progress"
    : "Empty";
  const style = status === "In report"
    ? "border-accent-border bg-accent-subtle text-accent"
    : status === "In progress"
      ? "border-border-2 bg-bg-2 text-fg-2"
      : "border-border bg-bg-1 text-fg-3";

  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] leading-4 ${style}`}>{status}</span>;
}

export function ReportProgressStrip() {
  const mounted = useMounted();
  const tools = useToolStore(state => state.tools);
  const lastEditedToolId = useToolStore(state => state.lastEditedToolId);
  const included = TOOL_REGISTRY.filter(tool => tools[tool.id]?.done && tools[tool.id]?.data).length;
  const lastEdited = TOOL_REGISTRY.find(tool => tool.id === lastEditedToolId && tools[tool.id]?.done && tools[tool.id]?.data)
    ?? TOOL_REGISTRY.find(tool => tools[tool.id]?.done && tools[tool.id]?.data);

  const visibleCount = mounted ? included : 0;
  return (
    <div aria-label="Report progress" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-sm font-medium text-fg">{visibleCount} of 7 in report</span>
      <div role="group" aria-label={`${visibleCount} of 7 tools included in report`} className="flex items-center gap-[6px]">
        {TOOL_REGISTRY.map(tool => {
          const isIncluded = mounted && Boolean(tools[tool.id]?.done && tools[tool.id]?.data);
          return (
            <span
              key={tool.id}
              title={tool.name}
              aria-label={`${tool.name}: ${isIncluded ? "included in report" : "not included in report"}`}
              className={`h-[6px] w-7 rounded-full ${isIncluded ? "bg-accent" : "bg-bg-3"}`}
            />
          );
        })}
      </div>
      {mounted && lastEdited && (
        <Link href={lastEdited.href} className="text-xs text-fg-2 underline decoration-border-3 underline-offset-4 hover:text-fg">
          Continue where you left off
        </Link>
      )}
    </div>
  );
}

export function ReportIncludedCount() {
  const mounted = useMounted();
  const tools = useToolStore(state => state.tools);
  const count = TOOL_REGISTRY.filter(tool => tools[tool.id]?.done && tools[tool.id]?.data).length;
  return <span>{mounted ? count : 0} of 7 tools included</span>;
}

export function ReportButton() {
  const mounted = useMounted();
  const tools = useToolStore(state => state.tools);
  const count = TOOL_REGISTRY.filter(tool => tools[tool.id]?.done && tools[tool.id]?.data).length;
  const visibleCount = mounted ? count : 0;

  return (
    <Link
      href="/report"
      className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        visibleCount > 0
          ? "border-accent bg-accent text-white hover:bg-accent-hover"
          : "border-border-2 bg-bg-1 text-fg-2 hover:border-border-3 hover:text-fg"
      }`}
    >
      <FileText aria-hidden="true" size={16} />
      <span>Open report</span>
      {visibleCount > 0 && (
        <span className="ml-0.5 rounded-full bg-black/20 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white">
          {visibleCount}
        </span>
      )}
    </Link>
  );
}

export function HomeKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const navigateByShortcut = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.isContentEditable
        || target.matches("input, textarea, select, [role='textbox']")
      )) return;

      const key = event.key.toLowerCase();
      if (key === "r") {
        event.preventDefault();
        router.push("/report");
        return;
      }

      const toolIndex = Number(key) - 1;
      if (!Number.isInteger(toolIndex) || toolIndex < 0 || toolIndex >= TOOL_REGISTRY.length) return;
      event.preventDefault();
      router.push(TOOL_REGISTRY[toolIndex].href);
    };

    window.addEventListener("keydown", navigateByShortcut);
    return () => window.removeEventListener("keydown", navigateByShortcut);
  }, [router]);

  return null;
}

export function LoadExampleProjectButton() {
  const loadExamples = useToolStore(state => state.loadExamples);
  return (
    <button
      type="button"
      onClick={() => loadExamples(exampleReportData())}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-2 bg-bg-1 px-5 text-sm font-medium text-fg transition-colors hover:border-border-3 hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      Load example project
    </button>
  );
}

export function LoadExampleButton({ toolId, href }: { toolId: ToolId; href: string }) {
  const router = useRouter();
  const loadExamples = useToolStore(state => state.loadExamples);
  const tool = TOOL_REGISTRY.find(item => item.id === toolId);

  if (!tool) return null;

  return (
    <button
      type="button"
      onClick={() => {
        loadExamples({
          [tool.id]: {
            title: tool.reportTitle,
            keySummary: `Legacy example inputs:\n${tool.exampleInput}`,
            interpretation: tool.exampleInterpretation,
          },
        });
        router.push(href);
      }}
      className="absolute right-4 top-12 z-20 rounded px-1 py-0.5 font-mono text-[10px] text-accent opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent"
    >
      Load example
    </button>
  );
}
