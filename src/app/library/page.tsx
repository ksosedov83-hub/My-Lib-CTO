"use client";

import { useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import BookForm from "@/components/BookForm";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import ConnectionManagementPanel from "@/components/ConnectionManagementPanel";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Book } from "@/types";
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Tag,
  Filter,
  BookMarked,
  Link2,
  X,
} from "lucide-react";

export default function LibraryPage() {
  const books = useLibraryStore((state) => state.books);
  const themes = useLibraryStore((state) => state.themes);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [viewingBookConnections, setViewingBookConnections] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    let filtered = books;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.description?.toLowerCase().includes(query)
      );
    }

    if (selectedTheme) {
      filtered = filtered.filter((book) => book.themes.includes(selectedTheme));
    }

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [books, searchQuery, selectedTheme]);

  const handleAddSuccess = () => {
    setShowAddDialog(false);
  };

  const handleEditSuccess = () => {
    setEditingBook(null);
  };

  const handleDeleteSuccess = () => {
    setDeletingBook(null);
  };

  const getThemeColor = (themeName: string): string => {
    const theme = themes.find((t) => t.name === themeName);
    return theme?.color || "#7c3aed";
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Управление библиотекой
            </h1>
            <p className="text-purple-200/70 mt-1">
              Управляйте вашей коллекцией из {books.length} книг{books.length % 10 === 1 && books.length % 100 !== 11 ? "и" : ""}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Добавить книгу
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none z-10" />
            <Input
              id="search"
              placeholder="Поиск по названию, автору или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-purple-300" />
            <select
              value={selectedTheme || ""}
              onChange={(e) => setSelectedTheme(e.target.value || null)}
              className="px-4 py-2 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            >
              <option value="">Все темы</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.name}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/10 backdrop-blur-sm border border-purple-500/20 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-purple-500/20 p-6">
                <BookMarked className="h-12 w-12 text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-purple-100 mb-2">
              {searchQuery || selectedTheme ? "Книги не найдены" : "Пока нет книг"}
            </h3>
            <p className="text-purple-200/70 mb-6">
              {searchQuery || selectedTheme
                ? "Попробуйте изменить параметры поиска или фильтра"
                : "Начните строить вашу библиотеку, добавив первую книгу"}
            </p>
            {!searchQuery && !selectedTheme && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                Добавить первую книгу
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="group rounded-xl bg-gradient-to-br from-purple-900/40 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 p-6 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="rounded-lg bg-purple-500/20 p-2 shrink-0">
                      <BookOpen className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-purple-100 truncate" title={book.title}>
                        {book.title}
                      </h3>
                      <p className="text-sm text-purple-200/80 truncate" title={book.author}>
                        {book.author}
                      </p>
                    </div>
                  </div>
                </div>

                {book.year && (
                  <div className="flex items-center gap-2 text-sm text-purple-300/80 mb-3">
                    <Calendar className="h-3 w-3" />
                    <span>{book.year}</span>
                  </div>
                )}

                {book.description && (
                  <p className="text-sm text-purple-200/70 line-clamp-3 mb-4">
                    {book.description}
                  </p>
                )}

                {book.themes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-3 w-3 text-purple-300" />
                      <span className="text-xs font-medium text-purple-300">Темы</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {book.themes.slice(0, 3).map((themeName) => (
                        <span
                          key={themeName}
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getThemeColor(themeName)}40`,
                            color: getThemeColor(themeName),
                          }}
                        >
                          {themeName}
                        </span>
                      ))}
                      {book.themes.length > 3 && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                          +{book.themes.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-purple-500/20">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingBook(book)}
                    className="flex-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Редактировать
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setViewingBookConnections(book)}
                    className="flex-1"
                  >
                    <Link2 className="h-3 w-3" />
                    Связи
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingBook(book)}
                    className="flex-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Удалить
                  </Button>
                </div>

                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <p className="text-xs text-purple-300/50">
                    Обновлено {new Date(book.updatedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Добавить новую книгу"
        maxWidth="lg"
      >
        <BookForm onSuccess={handleAddSuccess} onCancel={() => setShowAddDialog(false)} />
      </Dialog>

      <Dialog
        open={!!editingBook}
        onClose={() => setEditingBook(null)}
        title="Редактировать книгу"
        maxWidth="lg"
      >
        {editingBook && (
          <BookForm
            book={editingBook}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingBook(null)}
          />
        )}
      </Dialog>

      <DeleteConfirmDialog
        book={deletingBook}
        open={!!deletingBook}
        onClose={() => setDeletingBook(null)}
        onSuccess={handleDeleteSuccess}
      />

      {viewingBookConnections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="relative max-w-5xl w-full bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-connections-title"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-900/95 to-blue-900/95 backdrop-blur-xl">
              <div>
                <h2
                  id="book-connections-title"
                  className="text-2xl font-bold text-purple-100 flex items-center gap-2"
                >
                  <Link2 className="h-6 w-6" />
                  Связи
                </h2>
                <p className="text-sm text-purple-300 mt-1">{viewingBookConnections.title}</p>
              </div>
              <button
                onClick={() => setViewingBookConnections(null)}
                className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-purple-200 hover:text-purple-100"
                aria-label="Закрыть связи"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <ConnectionManagementPanel bookId={viewingBookConnections.id} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
