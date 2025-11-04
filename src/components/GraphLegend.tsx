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
      className={`bg-gradient-to-br from-purple-900/40 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-lg shadow-lg max-h-[calc(100vh-12rem)] overflow-y-auto ${className}`}
      role="complementary"
      aria-label="Легенда графа"
    >
      <div className="p-3 sticky top-0 bg-gradient-to-br from-purple-900/90 to-blue-900/80 backdrop-blur-sm border-b border-purple-500/20 z-10">
        <h3 className="text-sm font-semibold text-purple-100 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Легенда
        </h3>
      </div>
      
      <div className="p-3 space-y-3">
        {showThemes && themes.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-purple-200/80 mb-2 uppercase tracking-wide">
              Темы
            </h4>
            <div className="space-y-1.5">
              {themes.map((theme) => (
                <div key={theme.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full border border-white/30 flex-shrink-0"
                    style={{ backgroundColor: theme.color }}
                    aria-hidden="true"
                  />
                  <span className="text-purple-200 leading-tight" title={theme.name}>
                    {theme.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showConnections && (
          <div>
            <h4 className="text-xs font-semibold text-purple-200/80 mb-2 uppercase tracking-wide">
              Связи
            </h4>
            <div className="space-y-1.5">
              {(Object.keys(CONNECTION_COLORS) as ConnectionType[]).map((type) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-0.5 flex-shrink-0"
                    style={{ backgroundColor: CONNECTION_COLORS[type] }}
                    aria-hidden="true"
                  />
                  <span className="text-purple-200 leading-tight" title={CONNECTION_LABELS[type]}>
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
                <span className="leading-tight">Значок на узле показывает несколько тем из выбранных фильтров</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Смешанные цвета указывают на книги с пересекающимися темами</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500/30 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Затемнённые узлы не входят в текущий фильтр</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
