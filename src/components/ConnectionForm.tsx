"use client";

import { useState, useEffect } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Connection, ConnectionType } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { AlertCircle } from "lucide-react";

interface ConnectionFormProps {
  connection?: Connection;
  preselectedSourceId?: string;
  preselectedTargetId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CONNECTION_TYPES: { value: ConnectionType; label: string; description: string }[] = [
  { value: "influences", label: "Влияние", description: "Одна работа влияет на другую" },
  { value: "references", label: "Ссылка", description: "Прямые ссылки или цитирования" },
  { value: "contradicts", label: "Противоречие", description: "Противоположные или конфликтующие идеи" },
  { value: "expands", label: "Расширение", description: "Развивает или расширяет идеи" },
  {
    value: "similar-theme",
    label: "Схожая тема",
    description: "Общие темы или темы",
  },
  {
    value: "chronological",
    label: "Хронология",
    description: "Историческая или временная связь",
  },
  {
    value: "author-connection",
    label: "Связь авторов",
    description: "Одинаковый автор или связанные авторы",
  },
  { value: "custom", label: "Особая", description: "Особый тип связи" },
];

export default function ConnectionForm({
  connection,
  preselectedSourceId,
  preselectedTargetId,
  onSuccess,
  onCancel,
}: ConnectionFormProps) {
  const books = useLibraryStore((state) => state.books);
  const connections = useLibraryStore((state) => state.connections);
  const addConnection = useLibraryStore((state) => state.addConnection);
  const updateConnection = useLibraryStore((state) => state.updateConnection);

  const [sourceId, setSourceId] = useState(connection?.sourceId || preselectedSourceId || "");
  const [targetId, setTargetId] = useState(connection?.targetId || preselectedTargetId || "");
  const [type, setType] = useState<ConnectionType>(connection?.type || "influences");
  const [strength, setStrength] = useState(connection?.strength ?? 0.5);
  const [label, setLabel] = useState(connection?.label || "");
  const [notes, setNotes] = useState(connection?.notes || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (connection) {
      setSourceId(connection.sourceId);
      setTargetId(connection.targetId);
      setType(connection.type);
      setStrength(connection.strength);
      setLabel(connection.label || "");
      setNotes(connection.notes || "");
    }
  }, [connection]);

  const checkDuplicate = (src: string, tgt: string): boolean => {
    if (!connection) {
      return connections.some(
        (conn) =>
          (conn.sourceId === src && conn.targetId === tgt) ||
          (conn.sourceId === tgt && conn.targetId === src)
      );
    } else {
      return connections.some(
        (conn) =>
          conn.id !== connection.id &&
          ((conn.sourceId === src && conn.targetId === tgt) ||
            (conn.sourceId === tgt && conn.targetId === src))
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!sourceId || !targetId) {
      setError("Пожалуйста, выберите обе книги - источник и цель");
      return;
    }

    if (sourceId === targetId) {
      setError("Книга-источник и книга-цель должны быть разными");
      return;
    }

    if (checkDuplicate(sourceId, targetId)) {
      setError("Связь между этими книгами уже существует");
      return;
    }

    if (connection) {
      updateConnection(connection.id, {
        sourceId,
        targetId,
        type,
        strength,
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addConnection({
        sourceId,
        targetId,
        type,
        strength,
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  const availableBooks = books.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sourceBook" className="block text-sm font-medium text-purple-200 mb-2">
            Книга-источник
          </label>
          <select
            id="sourceBook"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            required
          >
            <option value="">Выберите книгу...</option>
            {availableBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="targetBook" className="block text-sm font-medium text-purple-200 mb-2">
            Книга-цель
          </label>
          <select
            id="targetBook"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
            required
          >
            <option value="">Выберите книгу...</option>
            {availableBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-purple-200 mb-2">
          Тип связи
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as ConnectionType)}
          className="w-full px-4 py-2 rounded-lg bg-purple-950/50 border border-purple-500/30 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
          required
        >
          {CONNECTION_TYPES.map((ct) => (
            <option key={ct.value} value={ct.value}>
              {ct.label} - {ct.description}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="strength" className="block text-sm font-medium text-purple-200 mb-2">
          Сила связи: {strength.toFixed(2)}
        </label>
        <div className="flex items-center gap-4">
          <span className="text-xs text-purple-300">Слабая</span>
          <input
            id="strength"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-purple-950/50 rounded-lg appearance-none cursor-pointer slider-purple"
          />
          <span className="text-xs text-purple-300">Сильная</span>
        </div>
        <p className="text-xs text-purple-300/70 mt-1">
          Влияет на визуальную толщину связи на графе
        </p>
      </div>

      <div>
        <label htmlFor="label" className="block text-sm font-medium text-purple-200 mb-2">
          Метка (необязательно)
        </label>
        <Input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="напр., Эволюция идей, Историческое влияние..."
          maxLength={100}
        />
        <p className="text-xs text-purple-300/70 mt-1">
          Короткая метка, показываемая на графе при наведении на связь
        </p>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-purple-200 mb-2">
          Заметки (необязательно)
        </label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Добавьте любые дополнительные заметки об этой связи..."
          rows={4}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {connection ? "Обновить связь" : "Создать связь"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
