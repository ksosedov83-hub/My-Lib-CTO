"use client";

import { useState, useMemo } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Connection } from "@/types";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import ConnectionForm from "@/components/ConnectionForm";
import { Plus, Edit2, Trash2, Link2, ArrowRight, Search, Filter } from "lucide-react";
import Input from "@/components/ui/Input";

interface ConnectionManagementPanelProps {
  bookId?: string;
}

const CONNECTION_TYPE_LABELS: Record<string, string> = {
  influences: "Влияние",
  references: "Ссылка",
  contradicts: "Противоречие",
  expands: "Расширение",
  "similar-theme": "Схожая тема",
  chronological: "Хронология",
  "author-connection": "Связь авторов",
  custom: "Особая",
};

const CONNECTION_COLORS: Record<string, string> = {
  influences: "#7c3aed",
  references: "#3b82f6",
  contradicts: "#ec4899",
  expands: "#06b6d4",
  "similar-theme": "#a855f7",
  chronological: "#f59e0b",
  "author-connection": "#10b981",
  custom: "#6b7280",
};

export default function ConnectionManagementPanel({ bookId }: ConnectionManagementPanelProps) {
  const connections = useLibraryStore((state) => state.connections);
  const getBook = useLibraryStore((state) => state.getBook);
  const deleteConnection = useLibraryStore((state) => state.deleteConnection);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [deletingConnection, setDeletingConnection] = useState<Connection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const filteredConnections = useMemo(() => {
    let filtered = bookId
      ? connections.filter((conn) => conn.sourceId === bookId || conn.targetId === bookId)
      : connections;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conn) => {
        const sourceBook = getBook(conn.sourceId);
        const targetBook = getBook(conn.targetId);
        return (
          sourceBook?.title.toLowerCase().includes(query) ||
          sourceBook?.author.toLowerCase().includes(query) ||
          targetBook?.title.toLowerCase().includes(query) ||
          targetBook?.author.toLowerCase().includes(query) ||
          conn.label?.toLowerCase().includes(query) ||
          conn.notes?.toLowerCase().includes(query)
        );
      });
    }

    if (typeFilter) {
      filtered = filtered.filter((conn) => conn.type === typeFilter);
    }

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [connections, bookId, searchQuery, typeFilter, getBook]);

  const handleAddSuccess = () => {
    setShowAddDialog(false);
  };

  const handleEditSuccess = () => {
    setEditingConnection(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingConnection) {
      deleteConnection(deletingConnection.id);
      setDeletingConnection(null);
    }
  };

  const uniqueTypes = Array.from(new Set(connections.map((c) => c.type)));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-purple-100 flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            {bookId ? "Связи книги" : "Управление связями"}
          </h2>
          <p className="text-purple-200/70 mt-1">
            {filteredConnections.length} связ
            {filteredConnections.length === 1
              ? "ь"
              : filteredConnections.length > 1 && filteredConnections.length < 5
                ? "и"
                : "ей"}
            {bookId && " для этой книги"}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Добавить связь
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none z-10" />
          <Input
            id="connection-search"
            placeholder="Поиск связей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11"
          />
        </div>
        {!bookId && uniqueTypes.length > 0 && (
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-purple-300" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            >
              <option value="">Все типы</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {CONNECTION_TYPE_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredConnections.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/10 backdrop-blur-sm border border-purple-500/20 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-500/20 p-6">
              <Link2 className="h-12 w-12 text-purple-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-purple-100 mb-2">
            {searchQuery || typeFilter ? "Связи не найдены" : "Пока нет связей"}
          </h3>
          <p className="text-purple-200/70 mb-6">
            {searchQuery || typeFilter
              ? "Попробуйте изменить параметры поиска или фильтра"
              : "Начните строить граф знаний, создав связи между книгами"}
          </p>
          {!searchQuery && !typeFilter && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4" />
              Создать первую связь
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConnections.map((connection) => {
            const sourceBook = getBook(connection.sourceId);
            const targetBook = getBook(connection.targetId);

            if (!sourceBook || !targetBook) return null;

            return (
              <div
                key={connection.id}
                className="group rounded-xl bg-gradient-to-br from-purple-900/40 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 p-5 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: `${CONNECTION_COLORS[connection.type]}30`,
                          borderColor: `${CONNECTION_COLORS[connection.type]}60`,
                          color: CONNECTION_COLORS[connection.type],
                        }}
                      >
                        {CONNECTION_TYPE_LABELS[connection.type] || connection.type}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-purple-300">
                        <span>Сила:</span>
                        <span className="font-semibold">{connection.strength.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-purple-100 truncate">
                          {sourceBook.title}
                        </p>
                        <p className="text-xs text-purple-300/80 truncate">{sourceBook.author}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-purple-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-purple-100 truncate">
                          {targetBook.title}
                        </p>
                        <p className="text-xs text-purple-300/80 truncate">{targetBook.author}</p>
                      </div>
                    </div>

                    {connection.label && (
                      <p className="text-sm text-purple-200 mt-2 italic">
                        &ldquo;{connection.label}&rdquo;
                      </p>
                    )}

                    {connection.notes && (
                      <p className="text-sm text-purple-200/70 mt-2 line-clamp-2">
                        {connection.notes}
                      </p>
                    )}

                    <div className="mt-3 text-xs text-purple-300/50">
                      Обновлено {new Date(connection.updatedAt).toLocaleDateString("ru-RU")}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingConnection(connection)}
                      title="Редактировать связь"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingConnection(connection)}
                      title="Удалить связь"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Добавить новую связь"
        maxWidth="lg"
      >
        <ConnectionForm
          preselectedSourceId={bookId}
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddDialog(false)}
        />
      </Dialog>

      <Dialog
        open={!!editingConnection}
        onClose={() => setEditingConnection(null)}
        title="Редактировать связь"
        maxWidth="lg"
      >
        {editingConnection && (
          <ConnectionForm
            connection={editingConnection}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingConnection(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={!!deletingConnection}
        onClose={() => setDeletingConnection(null)}
        title="Удалить связь"
        maxWidth="sm"
      >
        {deletingConnection && (
          <div className="space-y-4">
            <p className="text-purple-200">
              Вы уверены, что хотите удалить эту связь? Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDeleteConfirm} className="flex-1">
                Удалить
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDeletingConnection(null)}
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
