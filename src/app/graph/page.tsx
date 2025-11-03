"use client";

import { useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import LibraryGraph from "@/components/LibraryGraph";
import ConnectionManagementPanel from "@/components/ConnectionManagementPanel";
import { Book } from "@/types";
import { X, BookOpen, Calendar, Tag, Link2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function GraphPage() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [hoveredBook, setHoveredBook] = useState<Book | null>(null);
  const [showConnectionsPanel, setShowConnectionsPanel] = useState(false);

  const handleNodeClick = useCallback((book: Book) => {
    setSelectedBook(book);
  }, []);

  const handleNodeHover = useCallback((book: Book | null) => {
    setHoveredBook(book);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedBook(null);
  }, []);

  return (
    <AppShell>
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Library Knowledge Graph
            </h1>
            <p className="text-purple-200/70 mt-1">
              Explore connections between books in your cosmic library
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowConnectionsPanel(true)}>
              <Link2 className="h-4 w-4" />
              Manage Connections
            </Button>
            <div className="text-sm text-purple-300/70 bg-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-lg px-3 py-2">
              <span className="font-semibold">Tip:</span> Drag nodes, zoom with scroll, hover for
              details
            </div>
          </div>
        </div>

        <div className="flex-1 relative rounded-xl overflow-hidden border border-purple-500/20 bg-black/20 backdrop-blur-sm">
          <LibraryGraph
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            selectedBookId={selectedBook?.id}
            className="w-full h-full"
          />
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
                  Book Details
                </h2>
                <button
                  onClick={handleCloseDetails}
                  className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-200 hover:text-purple-100"
                  aria-label="Close details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-purple-100 mb-2">{selectedBook.title}</h3>
                  <p className="text-xl text-purple-200">by {selectedBook.author}</p>
                </div>

                {selectedBook.year && (
                  <div className="flex items-center gap-2 text-purple-300">
                    <Calendar className="h-4 w-4" />
                    <span>Published: {selectedBook.year}</span>
                  </div>
                )}

                {selectedBook.isbn && (
                  <div className="text-sm text-purple-300/80">
                    <span className="font-semibold">ISBN:</span> {selectedBook.isbn}
                  </div>
                )}

                {selectedBook.description && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-100 mb-2">Description</h4>
                    <p className="text-purple-200/80 leading-relaxed">{selectedBook.description}</p>
                  </div>
                )}

                {selectedBook.themes.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-100 mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Themes
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
                    <h4 className="text-lg font-semibold text-purple-100 mb-2">Notes</h4>
                    <p className="text-purple-200/80 italic leading-relaxed">{selectedBook.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-purple-500/30">
                  <ConnectionManagementPanel bookId={selectedBook.id} />
                </div>

                <div className="pt-4 border-t border-purple-500/30">
                  <div className="text-xs text-purple-300/60 space-y-1">
                    <p>Created: {new Date(selectedBook.createdAt).toLocaleDateString()}</p>
                    <p>
                      Last Updated: {new Date(selectedBook.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-[#7c3aed]"></div>
            <span className="text-purple-200">Influences</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span className="text-purple-200">References</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-[#ec4899]"></div>
            <span className="text-purple-200">Contradicts</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-[#06b6d4]"></div>
            <span className="text-purple-200">Expands</span>
          </div>
        </div>
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
                Manage All Connections
              </h2>
              <button
                onClick={() => setShowConnectionsPanel(false)}
                className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-200 hover:text-purple-100"
                aria-label="Close connections panel"
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
