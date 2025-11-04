"use client";

import { useLibraryStore } from "@/stores/useLibraryStore";
import { ConnectionType } from "@/types";
import { Info } from "lucide-react";

interface GraphLegendProps {
  className?: string;
  showThemes?: boolean;
  showConnections?: boolean;
  showOverlapInfo?: boolean;
}

const CONNECTION_COLORS: Record<ConnectionType, string> = {
  influences: "#7c3aed",
  references: "#3b82f6",
  contradicts: "#ec4899",
  expands: "#06b6d4",
  "similar-theme": "#a855f7",
  chronological: "#f59e0b",
  "author-connection": "#10b981",
  custom: "#6b7280",
};

const CONNECTION_LABELS: Record<ConnectionType, string> = {
  influences: "Влияние",
  references: "Ссылка",
  contradicts: "Противоречие",
  expands: "Расширение",
  "similar-theme": "Схожая тема",
  chronological: "Хронология",
  "author-connection": "Связь авторов",
  custom: "Особая",
};

export default function GraphLegend({
  className = "",
  showThemes = true,
  showConnections = true,
  showOverlapInfo = true,
}: GraphLegendProps) {
  const themes = useLibraryStore((state) => state.themes);

  return (
    <div
      className={`bg-gradient-to-br from-purple-900/40 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4 shadow-lg ${className}`}
      role="complementary"
      aria-label="Легенда графа"
    >
      <h3 className="text-sm font-semibold text-purple-100 mb-3 flex items-center gap-2">
        <Info className="h-4 w-4" />
        Легенда
      </h3>

      {showThemes && themes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-purple-200/80 mb-2 uppercase tracking-wide">
            Темы
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((theme) => (
              <div key={theme.id} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full border border-white/30 flex-shrink-0"
                  style={{ backgroundColor: theme.color }}
                  aria-hidden="true"
                />
                <span className="text-purple-200 truncate" title={theme.name}>
                  {theme.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showConnections && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-purple-200/80 mb-2 uppercase tracking-wide">
            Связи
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CONNECTION_COLORS) as ConnectionType[]).map((type) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-0.5 flex-shrink-0"
                  style={{ backgroundColor: CONNECTION_COLORS[type] }}
                  aria-hidden="true"
                />
                <span className="text-purple-200 truncate" title={CONNECTION_LABELS[type]}>
                  {CONNECTION_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showOverlapInfo && (
        <div className="pt-3 border-t border-purple-500/20">
          <h4 className="text-xs font-semibold text-purple-200/80 mb-2 uppercase tracking-wide">
            Визуальные индикаторы
          </h4>
          <div className="space-y-2 text-xs text-purple-200/80">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-400 flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="text-[8px] font-bold text-white">2+</span>
              </div>
              <span>Значок на узле показывает несколько тем из выбранных фильтров</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 mt-0.5" />
              <span>Смешанные цвета указывают на книги с пересекающимися темами</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500/30 flex-shrink-0 mt-0.5" />
              <span>Затемнённые узлы не входят в текущий фильтр</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
