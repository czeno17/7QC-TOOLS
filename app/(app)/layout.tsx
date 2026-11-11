import type { ReactNode } from "react";
import { ToolNavigation } from "@/components/shell/ToolNavigation";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ToolNavigation>{children}</ToolNavigation>;
}
