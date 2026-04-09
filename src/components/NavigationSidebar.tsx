import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { View } from "@/App";
import type { AppId } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ProxyToggle } from "@/components/proxy/ProxyToggle";
import { FailoverToggle } from "@/components/proxy/FailoverToggle";
import {
  Settings,
  History,
  Cpu,
  FolderOpen,
  KeyRound,
  Shield,
  Server,
  Wrench,
  Book,
} from "lucide-react";
import { McpIcon } from "@/components/BrandIcons";

interface NavItem {
  id: View;
  label: string;
  icon: ReactNode;
  show?: () => boolean;
}

interface NavigationSidebarProps {
  /** 当前激活的视图 */
  currentView: View;
  /** 当前激活的应用 */
  activeApp: AppId;
  /** 是否代理正在运行 */
  isProxyRunning: boolean;
  /** 是否当前应用正在接管 */
  isCurrentAppTakeoverActive: boolean;
  /** 切换视图回调 */
  onViewChange: (view: View) => void;
  /** 设置对话框默认标签页 */
  onOpenSettings: (tab?: string) => void;
}

export function NavigationSidebar({
  currentView,
  activeApp,
  isProxyRunning,
  isCurrentAppTakeoverActive,
  onViewChange,
  onOpenSettings,
}: NavigationSidebarProps) {
  const { t } = useTranslation();

  const isOpenClaw = activeApp === "openclaw";

  // 导航项配置
  const navItems: NavItem[] = [
    {
      id: "providers",
      label: t("nav.providers", { defaultValue: "供应商" }),
      icon: <Server className="w-4 h-4" />,
    },
    {
      id: "skills",
      label: t("nav.skills", { defaultValue: "Skills" }),
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: "prompts",
      label: t("nav.prompts", { defaultValue: "提示词" }),
      icon: <Book className="w-4 h-4" />,
    },
    {
      id: "mcp",
      label: t("nav.mcp", { defaultValue: "MCP" }),
      icon: <McpIcon size={16} />,
    },
    {
      id: "agents",
      label: t("nav.agents", { defaultValue: "Agents" }),
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: "sessions",
      label: t("nav.sessions", { defaultValue: "会话" }),
      icon: <History className="w-4 h-4" />,
    },
  ];

  // OpenClaw 特有的导航项
  const openClawNavItems: NavItem[] = [
    {
      id: "providers",
      label: t("nav.providers", { defaultValue: "供应商" }),
      icon: <Server className="w-4 h-4" />,
    },
    {
      id: "workspace",
      label: t("nav.workspace", { defaultValue: "工作区" }),
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      id: "sessions",
      label: t("nav.sessions", { defaultValue: "会话" }),
      icon: <History className="w-4 h-4" />,
    },
    {
      id: "openclawEnv",
      label: t("nav.env", { defaultValue: "环境变量" }),
      icon: <KeyRound className="w-4 h-4" />,
    },
    {
      id: "openclawTools",
      label: t("nav.tools", { defaultValue: "工具" }),
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "openclawAgents",
      label: t("nav.agents", { defaultValue: "Agents" }),
      icon: <Cpu className="w-4 h-4" />,
    },
  ];

  const currentNavItems = isOpenClaw ? openClawNavItems : navItems;

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Logo 区域 */}
      <div className="flex items-center px-2 pt-1">
        <a
          href="https://github.com/BluerAngala/cc-aitools"
          target="_blank"
          rel="noreferrer"
          className={cn(
            "text-xl font-semibold transition-colors",
            isProxyRunning && isCurrentAppTakeoverActive
              ? "text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              : "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300",
          )}
        >
          CC AITools
        </a>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1">
          {currentNavItems.map((item) => (
            <li key={item.id}>
              <Button
                variant={currentView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  currentView === item.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent",
                )}
                onClick={() => onViewChange(item.id)}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 底部状态区和设置按钮 */}
      <div className="flex flex-col gap-2 pt-2 border-t">
        {isProxyRunning && (
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">
              {t("proxy.status.running", { defaultValue: "代理运行中" })}
            </span>
            <div className="flex items-center gap-1">
              <ProxyToggle activeApp={activeApp} />
              <FailoverToggle activeApp={activeApp} />
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-center gap-3 hover:bg-accent"
          onClick={() => onOpenSettings("general")}
        >
          <Settings className="w-4 h-4" />
          <span className="truncate">
            {t("nav.settings", { defaultValue: "设置" })}
          </span>
        </Button>
      </div>
    </div>
  );
}

export default NavigationSidebar;
