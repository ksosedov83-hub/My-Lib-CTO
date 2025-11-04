"use client";

import { useCallback, useMemo } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useAppStore } from "@/stores/useAppStore";
import { X, Filter, CheckSquare } from "lucide-react";
import Button from "@/components/ui/Button";

interface ThemeFilterPanelProps {
  className?: string;
  compact?: boolean;
}

export default function ThemeFilterPanel({ className = "", compact = false }: ThemeFilterPanelProps) {
  const themes = useLibraryStore((state) => state.themes);
  const selectedThemes = useAppStore((state) => state.selectedThemes);
  const toggleThemeFilter = useAppStore((state) => state.toggleThemeFilter);
  const clearThemeFilters = useAppStore((state) => state.clearThemeFilters);
  const setThemeFilters = useAppStore((state) => state.setThemeFilters);

  const allThemeNames = useMemo(() => themes.map((t) => t.name), [themes]);

  const handleSelectAll = useCallback(() => {
    setThemeFilters(allThemeNames);
  }, [allThemeNames, setThemeFilters]);

  const isAllSelected = selectedThemes.length === themes.length;
  const hasSelection = selectedThemes.length > 0;

  return (
    <div
      className={`bg-gradient-to-br from-purple-900/40 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4 shadow-lg ${className}`}
      role="region"
      aria-label="Фильтры по темам"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-purple-100 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Фильтр по темам
        </h3>
        {hasSelection && (
          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">
            {selectedThemes.length} выбрано
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {themes.map((theme) => {
          const isSelected = selectedThemes.includes(theme.name);
          return (
            <button
              key={theme.id}
              onClick={() => toggleThemeFilter(theme.name)}
              className={`
                group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                ${
                  isSelected
                    ? "border-purple-400/60 bg-purple-500/30 shadow-md"
                    : "border-purple-500/20 bg-purple-900/20 hover:bg-purple-500/10"
                }
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-950
              `}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? "Убрать" : "Добавить"} фильтр ${theme.name}`}
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected ? "border-purple-300 bg-purple-400" : "border-purple-400/40"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-purple-950"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: theme.color }}
                aria-hidden="true"
              />
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-purple-100" : "text-purple-200"
                }`}
              >
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>

      {themes.length === 0 && (
        <p className="text-sm text-purple-300/60 text-center py-2">
          Нет доступных тем. Добавьте темы в библиотеку для фильтрации.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-3 border-t border-purple-500/20">
        <Button
          onClick={handleSelectAll}
          disabled={isAllSelected || themes.length === 0}
          variant="secondary"
          size="sm"
          aria-label="Выбрать все темы"
        >
          <CheckSquare className="h-3 w-3" />
          Выбрать всё
        </Button>
        <Button
          onClick={clearThemeFilters}
          disabled={!hasSelection}
          variant="secondary"
          size="sm"
          aria-label="Очистить все фильтры"
        >
          <X className="h-3 w-3" />
          Очистить фильтры
        </Button>
      </div>

      {hasSelection && (
        <div
          className="mt-3 pt-3 border-t border-purple-500/20 text-xs text-purple-300/80"
          role="status"
          aria-live="polite"
        >
          Показаны книги с темами: <span className="font-semibold">{selectedThemes.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
