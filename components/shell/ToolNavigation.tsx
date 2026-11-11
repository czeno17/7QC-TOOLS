"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { TOOL_REGISTRY } from "@/lib/tools/navigation";
import { useToolStore } from "@/store/tools";

const subscribeToMount = () => () => {};
const getClientMountSnapshot = () => true;
const getServerMountSnapshot = () => false;

function ToolStatusDot({ toolId }: { toolId: (typeof TOOL_REGISTRY)[number]["id"] }) {
  const mounted = useSyncExternalStore(subscribeToMount, getClientMountSnapshot, getServerMountSnapshot);
  const toolState = useToolStore(state => state.tools[toolId]);

  const stateClass = !mounted || !toolState?.done || !toolState.data
    ? "bg-fg-4"
    : toolState.inReport
      ? "bg-accent"
      : "bg-ok";

  return <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${stateClass}`} />;
}

function ShortcutBadge({ children }: { children: string }) {
  return <kbd className="rounded border border-border-2 px-1.5 py-0.5 font-mono text-[9px] leading-none text-fg-4">{children}</kbd>;
}

export function ToolNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openedAtPath, setOpenedAtPath] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const isOpen = openedAtPath === pathname;

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedAtPath(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

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
        setOpenedAtPath(null);
        return;
      }

      const toolIndex = Number(key) - 1;
      if (!Number.isInteger(toolIndex) || toolIndex < 0 || toolIndex >= TOOL_REGISTRY.length) return;
      event.preventDefault();
      router.push(TOOL_REGISTRY[toolIndex].href);
      setOpenedAtPath(null);
    };

    window.addEventListener("keydown", navigateByShortcut);
    return () => window.removeEventListener("keydown", navigateByShortcut);
  }, [router]);

  const toolLinkClass = (active: boolean) => `flex items-center rounded px-3 py-2.5 text-sm transition-colors ${
    active ? "bg-accent-subtle text-accent" : "text-fg-2 hover:bg-bg-2 hover:text-fg"
  }`;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-3 px-5">
          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-tool-navigation"
            onClick={() => setOpenedAtPath(isOpen ? null : pathname)}
            className="flex size-9 items-center justify-center rounded border border-border bg-bg-1 text-fg transition-colors hover:bg-bg-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {isOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <Link href="/" className="font-semibold tracking-wide text-fg hover:text-accent">QC Toolkit</Link>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-bg-1 transition-[width] duration-200 lg:flex ${
            collapsed ? "w-16" : "w-64"
          }`}
        >
          <div className={`flex h-14 shrink-0 items-center border-b border-border ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
            <Link href="/" aria-label="QC Toolkit home" title={collapsed ? "QC Toolkit" : undefined} className="flex min-w-0 items-center gap-2 text-fg hover:text-accent">
              <span className="flex size-7 shrink-0 items-center justify-center rounded border border-accent-border bg-accent-subtle font-mono text-[10px] font-medium text-accent">QC</span>
              {!collapsed && <span className="truncate font-semibold tracking-wide">QC Toolkit</span>}
            </Link>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(value => !value)}
              className="flex size-8 shrink-0 items-center justify-center rounded text-fg-3 hover:bg-bg-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                {collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
              </svg>
            </button>
          </div>
          <nav aria-label="Quality tools" className="min-h-0 flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {TOOL_REGISTRY.map((tool, index) => {
                const active = pathname === tool.href;
                return (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      aria-current={active ? "page" : undefined}
                      aria-label={`${tool.name} (${index + 1})`}
                      title={collapsed ? `${tool.name} (${index + 1})` : undefined}
                      className={`${toolLinkClass(active)} ${collapsed ? "justify-center gap-1.5 px-1" : "justify-between gap-2"}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <ShortcutBadge>{String(index + 1)}</ShortcutBadge>
                        {!collapsed && <span className="truncate">{tool.name}</span>}
                      </span>
                      <ToolStatusDot toolId={tool.id} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="shrink-0 border-t border-border p-2">
            <Link
              href="/report"
              aria-current={pathname === "/report" ? "page" : undefined}
              title={collapsed ? "Report Dashboard (R)" : undefined}
              className={`${toolLinkClass(pathname === "/report")} ${collapsed ? "justify-center gap-1.5 px-1" : "justify-between gap-2"}`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <ShortcutBadge>R</ShortcutBadge>
                {!collapsed && <span className="truncate">Report Dashboard</span>}
              </span>
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {isOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpenedAtPath(null)}
            className="fixed inset-0 z-40 cursor-default bg-black/60"
          />
          <nav
            id="mobile-tool-navigation"
            aria-label="Quality tools"
            className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col border-r border-border bg-bg-1 shadow-2xl"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <Link href="/" onClick={() => setOpenedAtPath(null)} className="flex items-center gap-2 font-semibold text-fg hover:text-accent">
                <span className="flex size-7 items-center justify-center rounded border border-accent-border bg-accent-subtle font-mono text-[10px] text-accent">QC</span>
                QC Toolkit
              </Link>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpenedAtPath(null)}
                className="flex size-9 items-center justify-center rounded text-fg-3 hover:bg-bg-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <ul className="flex-1 space-y-1 overflow-y-auto p-3">
              {TOOL_REGISTRY.map((tool, index) => {
                const active = pathname === tool.href;
                return (
                  <li key={tool.href}>
                    <Link
                      href={tool.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpenedAtPath(null)}
                      className={`${toolLinkClass(active)} justify-between gap-3`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <ShortcutBadge>{String(index + 1)}</ShortcutBadge>
                        <span className="truncate">{tool.name}</span>
                      </span>
                      <ToolStatusDot toolId={tool.id} />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="shrink-0 border-t border-border p-3">
              <Link
                href="/report"
                aria-current={pathname === "/report" ? "page" : undefined}
                onClick={() => setOpenedAtPath(null)}
                className={`${toolLinkClass(pathname === "/report")} justify-between gap-3`}
              >
                <span className="flex items-center gap-3"><ShortcutBadge>R</ShortcutBadge><span>Report Dashboard</span></span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
