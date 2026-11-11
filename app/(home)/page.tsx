import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  HomeKeyboardShortcuts,
  LoadExampleButton,
  LoadExampleProjectButton,
  ReportIncludedCount,
  ReportButton,
  ReportProgressStrip,
  ToolStatusPill,
} from "@/components/home/HomeClient";
import { TOOL_REGISTRY } from "@/lib/tools/navigation";

const GROUPS = [
  { name: "Find the problem", description: "Collect and rank what is going wrong." },
  { name: "Understand the data", description: "Measure spread, relationships and sources of variation." },
  { name: "Control the process", description: "Check that the process stays stable." },
] as const;

function ToolCard({ tool }: { tool: (typeof TOOL_REGISTRY)[number] }) {
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-border bg-bg-1 transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-accent/50 focus-within:-translate-y-px focus-within:border-accent/50 motion-reduce:transform-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0">
      <Link
        href={tool.href}
        aria-labelledby={`tool-name-${tool.id}`}
        aria-describedby={`tool-description-${tool.id}`}
        className="relative z-0 flex h-full flex-col rounded-lg p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 font-mono text-[11px] tracking-wide text-fg-3">{tool.number}</span>
            <h3 id={`tool-name-${tool.id}`} className="truncate text-base font-semibold text-fg">{tool.name}</h3>
          </div>
          <div className="shrink-0">
            <ToolStatusPill toolId={tool.id} />
          </div>
        </div>
        <div className="relative mt-2 min-w-0 flex-1 pr-20">
          <p id={`tool-description-${tool.id}`} className="line-clamp-2 text-sm leading-5 text-fg-2">{tool.useWhen}</p>
          <ArrowUpRight
            aria-hidden="true"
            size={16}
            className="absolute bottom-0 right-0 text-fg-3 transition-[color,transform] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent group-focus-within:-translate-y-0.5 group-focus-within:translate-x-0.5 group-focus-within:text-accent motion-reduce:transform-none"
          />
        </div>
      </Link>
      <LoadExampleButton toolId={tool.id} href={tool.href} />
    </article>
  );
}

export default function HomePage() {
  return (
    <>
      <HomeKeyboardShortcuts />
      <header className="border-b border-border bg-bg-1">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-semibold tracking-wide text-fg hover:text-accent">QC Toolkit</Link>
          <ReportButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
        <header className="relative mb-12 overflow-hidden rounded-lg border border-border bg-bg-1 px-6 py-8 sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 size-96 rounded-full bg-accent-subtle blur-3xl" />
          <p className="relative font-mono text-[10px] uppercase tracking-[0.08em] text-accent">Quality Management Tools</p>
          <h1 className="relative mt-3 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">7 QC Tools</h1>
          <p className="relative mt-4 max-w-2xl text-sm leading-6 text-fg-2 sm:text-base">
            Find the problem, understand its causes, and prove the fix with data. Everything runs in your browser and saves on this device.
          </p>
          <div className="relative mt-4">
            <ReportProgressStrip />
          </div>
          <div className="relative mt-5 flex flex-wrap gap-3">
            <Link href="/pareto" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              Start with Pareto
            </Link>
            <LoadExampleProjectButton />
          </div>
        </header>

        <div className="space-y-12">
          {GROUPS.map(({ name, description }) => {
            const tools = TOOL_REGISTRY.filter(tool => tool.group === name);
            const groupId = `group-${name.replaceAll(" ", "-").toLowerCase()}`;
            return (
              <section key={name} aria-labelledby={groupId}>
                <h2 id={groupId} className="font-mono text-[10px] uppercase tracking-[0.08em] text-fg-3">{name}</h2>
                <p className="mt-1 text-sm text-fg-2">{description}</p>
                <div className="mt-3 grid auto-rows-fr items-stretch gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-12 flex flex-col gap-5 rounded-lg border border-accent-border bg-accent-subtle p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Final output</p>
            <h2 className="mt-2 text-base font-semibold text-fg">Report Dashboard</h2>
            <p className="mt-1 text-sm text-fg-2">Compile your analyses into a printable audit document</p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="font-mono text-[10px] text-fg-3"><ReportIncludedCount /></span>
            <Link href="/report" className="inline-flex min-h-10 items-center justify-center rounded-md border border-accent-border bg-bg-1 px-4 text-sm font-medium text-fg transition-colors hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              Open report
            </Link>
          </div>
        </section>

        <footer className="mt-8 border-t border-border pt-4 font-mono text-[10px] text-fg-4">
          Data stays on this device. Works offline.
        </footer>
      </main>
    </>
  );
}
