import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormLabel } from "@/components/ui/form";
import { ClaudeIcon, CodexIcon, GeminiIcon } from "@/components/BrandIcons";
import {
  Zap,
  Star,
  Layers,
  Settings2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ProviderPreset } from "@/config/claudeProviderPresets";
import type { CodexProviderPreset } from "@/config/codexProviderPresets";
import type { GeminiProviderPreset } from "@/config/geminiProviderPresets";
import type { ProviderCategory } from "@/types";
import {
  universalProviderPresets,
  type UniversalProviderPreset,
} from "@/config/universalProviderPresets";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Button } from "@/components/ui/button";

type PresetEntry = {
  id: string;
  preset: ProviderPreset | CodexProviderPreset | GeminiProviderPreset;
};

interface ProviderPresetSelectorProps {
  selectedPresetId: string | null;
  groupedPresets: Record<string, PresetEntry[]>;
  categoryKeys: string[];
  presetCategoryLabels: Record<string, string>;
  onPresetChange: (value: string) => void;
  onUniversalPresetSelect?: (preset: UniversalProviderPreset) => void;
  onManageUniversalProviders?: () => void;
  category?: ProviderCategory; // 当前选中的分类
  // 新增：扁平化的预设列表（用于按字母排序显示）
  flatPresets?: PresetEntry[];
}

export function ProviderPresetSelector({
  selectedPresetId,
  groupedPresets,
  categoryKeys,
  presetCategoryLabels,
  onPresetChange,
  onUniversalPresetSelect,
  onManageUniversalProviders,
  category,
  flatPresets,
}: ProviderPresetSelectorProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // 默认显示的预设数量
  const DEFAULT_VISIBLE_COUNT = 30;

  // 获取要显示的预设列表
  const presetsToShow = flatPresets || [];
  const hasMorePresets = presetsToShow.length > DEFAULT_VISIBLE_COUNT;
  const visiblePresets = isExpanded
    ? presetsToShow
    : presetsToShow.slice(0, DEFAULT_VISIBLE_COUNT);

  const getCategoryHint = (): React.ReactNode => {
    switch (category) {
      case "official":
        return t("providerForm.officialHint", {
          defaultValue: "💡 官方供应商使用浏览器登录，无需配置 API Key",
        });
      case "cn_official":
        return t("providerForm.cnOfficialApiKeyHint", {
          defaultValue: "💡 国产官方供应商只需填写 API Key，请求地址已预设",
        });
      case "aggregator":
        return t("providerForm.aggregatorApiKeyHint", {
          defaultValue: "💡 聚合服务供应商只需填写 API Key 即可使用",
        });
      case "third_party":
        return t("providerForm.thirdPartyApiKeyHint", {
          defaultValue: "💡 第三方供应商需要填写 API Key 和请求地址",
        });
      case "custom":
        return t("providerForm.customApiKeyHint", {
          defaultValue: "💡 自定义配置需手动填写所有必要字段",
        });
      case "omo":
        return t("providerForm.omoHint", {
          defaultValue:
            "💡 OMO 配置管理 Agent 模型分配，兼容 oh-my-openagent.jsonc / oh-my-opencode.jsonc",
        });
      default:
        return t("providerPreset.hint", {
          defaultValue: "选择预设后可继续调整下方字段。",
        });
    }
  };

  const renderPresetIcon = (
    preset: ProviderPreset | CodexProviderPreset | GeminiProviderPreset,
  ) => {
    // 优先使用预设的 icon 字段（ProviderIcon 组件）
    if (preset.icon) {
      return (
        <ProviderIcon
          icon={preset.icon}
          name={preset.name}
          size={16}
          showFallback={false}
        />
      );
    }

    // 兼容旧的 theme.icon 配置
    const iconType = preset.theme?.icon;
    if (!iconType) return null;

    switch (iconType) {
      case "claude":
        return <ClaudeIcon size={14} />;
      case "codex":
        return <CodexIcon size={14} />;
      case "gemini":
        return <GeminiIcon size={14} />;
      case "generic":
        return <Zap size={14} />;
      default:
        return null;
    }
  };

  const getPresetButtonClass = (
    isSelected: boolean,
    preset: ProviderPreset | CodexProviderPreset | GeminiProviderPreset,
  ) => {
    const baseClass =
      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors";

    if (isSelected) {
      if (preset.theme?.backgroundColor) {
        return `${baseClass} text-white`;
      }
      return `${baseClass} bg-blue-500 text-white dark:bg-blue-600`;
    }

    return `${baseClass} bg-accent text-muted-foreground hover:bg-accent/80`;
  };

  const getPresetButtonStyle = (
    isSelected: boolean,
    preset: ProviderPreset | CodexProviderPreset | GeminiProviderPreset,
  ) => {
    if (!isSelected || !preset.theme?.backgroundColor) {
      return undefined;
    }

    return {
      backgroundColor: preset.theme.backgroundColor,
      color: preset.theme.textColor || "#FFFFFF",
    };
  };

  return (
    <div className="space-y-3">
      <FormLabel>{t("providerPreset.label")}</FormLabel>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPresetChange("custom")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedPresetId === "custom"
              ? "bg-blue-500 text-white dark:bg-blue-600"
              : "bg-accent text-muted-foreground hover:bg-accent/80"
          }`}
        >
          {t("providerPreset.custom")}
        </button>

        {/* 优先使用 flatPresets（按字母排序），否则使用分组显示 */}
        {flatPresets
          ? visiblePresets.map((entry) => {
              const isSelected = selectedPresetId === entry.id;
              const isPartner = entry.preset.isPartner;
              const category = entry.preset.category ?? "others";
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onPresetChange(entry.id)}
                  className={`${getPresetButtonClass(isSelected, entry.preset)} relative`}
                  style={getPresetButtonStyle(isSelected, entry.preset)}
                  title={
                    presetCategoryLabels[category] ?? t("providerPreset.other")
                  }
                >
                  {renderPresetIcon(entry.preset)}
                  {entry.preset.nameKey
                    ? t(entry.preset.nameKey)
                    : entry.preset.name}
                  {isPartner && (
                    <span className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Star className="h-2.5 w-2.5 fill-current" />
                    </span>
                  )}
                </button>
              );
            })
          : categoryKeys.map((category) => {
              const entries = groupedPresets[category];
              if (!entries || entries.length === 0) return null;
              return entries.map((entry) => {
                const isSelected = selectedPresetId === entry.id;
                const isPartner = entry.preset.isPartner;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onPresetChange(entry.id)}
                    className={`${getPresetButtonClass(isSelected, entry.preset)} relative`}
                    style={getPresetButtonStyle(isSelected, entry.preset)}
                    title={
                      presetCategoryLabels[category] ??
                      t("providerPreset.other")
                    }
                  >
                    {renderPresetIcon(entry.preset)}
                    {entry.preset.nameKey
                      ? t(entry.preset.nameKey)
                      : entry.preset.name}
                    {isPartner && (
                      <span className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                        <Star className="h-2.5 w-2.5 fill-current" />
                      </span>
                    )}
                  </button>
                );
              });
            })}

        {/* 展开/折叠按钮 */}
        {flatPresets && hasMorePresets && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border-dashed"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {t("providerPreset.collapse", { defaultValue: "收起" })}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {t("providerPreset.moreProviders", {
                  defaultValue: "更多供应商",
                })}
              </>
            )}
          </Button>
        )}
      </div>

      {onUniversalPresetSelect && universalProviderPresets.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {universalProviderPresets.map((preset) => (
              <button
                key={`universal-${preset.providerType}`}
                type="button"
                onClick={() => onUniversalPresetSelect(preset)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-accent text-muted-foreground hover:bg-accent/80 relative"
                title={t("universalProvider.hint", {
                  defaultValue:
                    "跨应用统一配置，自动同步到 Claude/Codex/Gemini",
                })}
              >
                <ProviderIcon icon={preset.icon} name={preset.name} size={14} />
                {preset.name}
                <span className="absolute -top-1 -right-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                  <Layers className="h-2.5 w-2.5" />
                </span>
              </button>
            ))}
            {onManageUniversalProviders && (
              <button
                type="button"
                onClick={onManageUniversalProviders}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-accent text-muted-foreground hover:bg-accent/80"
                title={t("universalProvider.manage", {
                  defaultValue: "管理统一供应商",
                })}
              >
                <Settings2 className="h-4 w-4" />
                {t("universalProvider.manage", {
                  defaultValue: "管理",
                })}
              </button>
            )}
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">{getCategoryHint()}</p>
    </div>
  );
}
