import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ToolReportData {
  title: string;
  keySummary: string;
  interpretation: string;
  chartSvgs?: string[];
  tableHtmls?: string[];
}

interface ToolState {
  tools: Record<string, { data: ToolReportData | null; done: boolean; inReport: boolean }>;
  lastEditedToolId: string | null;
  updateTool: (id: string, data: ToolReportData | null, done: boolean) => void;
  loadExamples: (examples: Record<string, ToolReportData>) => void;
  toggleInReport: (id: string) => void;
}

export const useToolStore = create<ToolState>()(
  persist(
    (set) => ({
      tools: {},
      lastEditedToolId: null,
      updateTool: (id, data, done) => set((state) => ({
        tools: { ...state.tools, [id]: { ...state.tools[id], data, done, inReport: state.tools[id]?.inReport ?? false } },
        lastEditedToolId: data ? id : state.lastEditedToolId === id ? null : state.lastEditedToolId,
      })),
      loadExamples: (examples) => set((state) => {
        const tools = { ...state.tools };
        for (const [id, data] of Object.entries(examples)) {
          tools[id] = { ...tools[id], data, done: true, inReport: false };
        }
        const editedIds = Object.keys(examples);
        return {
          tools,
          lastEditedToolId: editedIds.at(-1) ?? state.lastEditedToolId,
        };
      }),
      toggleInReport: (id) => set((state) => ({
        tools: { ...state.tools, [id]: { ...state.tools[id], inReport: !state.tools[id]?.inReport } }
      }))
    }),
    { name: 'qc-toolkit-v2' }
  )
);
