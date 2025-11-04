"use client";

import { useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import LibraryGraph from "@/components/LibraryGraph";
import ConnectionManagementPanel from "@/components/ConnectionManagementPanel";
import ThemeFilterPanel from "@/components/ThemeFilterPanel";
import GraphLegend from "@/components/GraphLegend";
import { useAppStore } from "@/stores/useAppStore";
import { Book } from "@/types";
import { X, BookOpen, Calendar, Tag, Link2, Filter, Eye } from "lucide-react";
import Button from "@/components/ui/Button";

export default function GraphPage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showConnectionsPanel, setShowConnectionsPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  const selectedThemes = useAppStore((state) => state.selectedThemes);

  const handleNodeClick = useCallback((book: Book) => {
    setSelectedBook(book);
  }, []);

  const handleNodeHover = useCallback((_book: Book | null) => {
    // Hover handling is done internally by LibraryGraph
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedBook(null);
  }, []);

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Граф знаний библиотеки
            </h1>
            <p className="text-purple-200/70 mt-1">
              Исследуйте связи между книгами в вашей космической библиотеке
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              variant={showFilterPanel ? "primary" : "secondary"}
            >
              <Filter className="h-4 w-4" />
              {showFilterPanel ? "Скрыть" : "Показать"} фильтры
            </Button>
            <Button
              onClick={() => setShowLegend(!showLegend)}
              variant={showLegend ? "primary" : "secondary"}
            >
              <Eye className="h-4 w-4" />
              {showLegend ? "Скрыть" : "Показать"} легенду
            </Button>
            <Button onClick={() => setShowConnectionsPanel(true)}>
              <Link2 className="h-4 w-4" />
              Связи
            </Button>
          </div>
        </div>

        {showFilterPanel && (
          <ThemeFilterPanel className="animate-in fade-in slide-in-from-top-2 duration-300" />
        )}

        <div className="flex-1 relative rounded-xl overflow-hidden border border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <LibraryGraph
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            selectedBookId={selectedBook?.id}
            selectedThemes={selectedThemes}
            className="w-full h-full"
          />

          {showLegend && (
            <div className="absolute top-20 right-4 max-w-xs hidden lg:block animate-in fade-in slide-in-from-right-2 duration-300">
              <GraphLegend />
            </div>
          )}

          {showLegend && (
            <div className="absolute bottom-20 left-4 right-4 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <GraphLegend />
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-auto md:bottom-auto md:top-4 md:left-4 max-w-sm">
            <div className="text-sm text-purple-300/70 bg-purple-900/80 backdrop-blur-md border border-purple-500/30 rounded-lg px-3 py-2 shadow-lg">
              <span className="font-semibold">3D Controls:</span> Drag to rotate • Scroll to zoom •
              Right-click to pan • Click nodes to focus • Press F for fullscreen
            </div>
          </div>
        </div>

        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
              className="relative max-w-2xl w-full bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="book-details-title"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/95 to-blue-900/95 backdrop-blur-xl">
                <h2
                  id="book-details-title"
                  className="text-2xl font-bold text-purple-100 flex items-center gap-2"
                >
                  <BookOpen className="h-6 w-6" />
                  Детали книги
                </h2>
                <button
                  onClick={handleCloseDetails}
                  className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-200 hover:text-purple-100"
                  aria-label="Закрыть детали"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-purple-100 mb-2">{selectedBook.title}</h3>
                  <p className="text-xl text-purple-200">{selectedBook.author}</p>
                </div>

                {selectedBook.year && (
                  <div className="flex items-center gap-2 text-purple-300">
                    <Calendar className="h-4 w-4" />
                    <span>Опубликовано: {selectedBook.year}</span>
                  </div>
                )}

                {selectedBook.isbn && (
                  <div className="text-sm text-purple-300/80">
                    <span className="font-semibold">ISBN:</span> {selectedBook.isbn}
                  </div>
                )}

                {selectedBook.description && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-100 mb-2">Описание</h4>
                    <p className="text-purple-200/80 leading-relaxed">{selectedBook.description}</p>
                  </div>
                )}

                {selectedBook.themes.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-100 mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Темы
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBook.themes.map((theme) => (
                        <span
                          key={theme}
                          className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 text-sm font-medium"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBook.notes && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-100 mb-2">Заметки</h4>
                    <p className="text-purple-200/80 italic leading-relaxed">
                      {selectedBook.notes}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-purple-500/30">
                  <ConnectionManagementPanel bookId={selectedBook.id} />
                </div>

                <div className="pt-4 border-t border-purple-500/30">
                  <div className="text-xs text-purple-300/60 space-y-1">
                    <p>Создано: {new Date(selectedBook.createdAt).toLocaleDateString("ru-RU")}</p>
                    <p>Обновлено: {new Date(selectedBook.updatedAt).toLocaleDateString("ru-RU")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConnectionsPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="relative max-w-5xl w-full bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connections-panel-title"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/95 to-blue-900/95 backdrop-blur-xl">
              <h2
                id="connections-panel-title"
                className="text-2xl font-bold text-purple-100 flex items-center gap-2"
              >
                <Link2 className="h-6 w-6" />
                Управление всеми связями
              </h2>
              <button
                onClick={() => setShowConnectionsPanel(false)}
                className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-200 hover:text-purple-100"
                aria-label="Закрыть панель связей"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <ConnectionManagementPanel />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
