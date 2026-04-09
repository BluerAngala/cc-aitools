import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DualColumnLayoutProps {
  /** 左侧菜单栏内容 */
  sidebar: ReactNode;
  /** 右侧主内容区 */
  content: ReactNode;
  /** 左侧栏宽度，默认 40% */
  sidebarWidth?: string;
  /** 右侧内容区宽度，默认 50% */
  contentWidth?: string;
  /** 中间间距，默认 10% */
  gap?: string;
  /** 额外的类名 */
  className?: string;
}

export function DualColumnLayout({
  sidebar,
  content,
  sidebarWidth = "40%",
  contentWidth = "50%",
  gap = "10%",
  className,
}: DualColumnLayoutProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div className="flex w-full h-full" style={{ gap }}>
        {/* 左侧菜单栏 */}
        <aside
          className="flex flex-col h-full overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          {sidebar}
        </aside>

        {/* 右侧主内容区 */}
        <main
          className="flex flex-col h-full overflow-hidden"
          style={{ width: contentWidth }}
        >
          {content}
        </main>
      </div>
    </div>
  );
}
