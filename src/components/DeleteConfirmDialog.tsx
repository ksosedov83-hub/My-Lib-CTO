"use client";

import { Book } from "@/types";
import { useLibraryStore } from "@/stores/useLibraryStore";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteConfirmDialog({
  book,
  open,
  onClose,
  onSuccess,
}: DeleteConfirmDialogProps) {
  const deleteBook = useLibraryStore((state) => state.deleteBook);
  const getConnectionsByBook = useLibraryStore((state) => state.getConnectionsByBook);

  if (!book) return null;

  const connections = getConnectionsByBook(book.id);
  const hasConnections = connections.length > 0;

  const handleDelete = () => {
    deleteBook(book.id);
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Подтверждение удаления" maxWidth="md">
      <div className="space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-pink-900/20 border border-pink-500/30">
          <div className="rounded-full bg-pink-500/20 p-2 shrink-0">
            <AlertTriangle className="h-6 w-6 text-pink-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-pink-200 mb-2">
              Вы уверены, что хотите удалить эту книгу?
            </h4>
            <p className="text-purple-200/80">
              Это действие нельзя отменить. Следующая книга будет окончательно удалена из вашей
              библиотеки:
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-4">
          <h5 className="text-xl font-bold text-purple-100 mb-1">{book.title}</h5>
          <p className="text-purple-200/80 mb-3">{book.author}</p>
          {book.year && (
            <p className="text-sm text-purple-300/70 mb-2">Опубликовано: {book.year}</p>
          )}
          {book.themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.themes.map((theme) => (
                <span
                  key={theme}
                  className="px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}
        </div>

        {hasConnections && (
          <div className="rounded-lg bg-yellow-900/20 border border-yellow-500/30 p-4">
            <p className="text-yellow-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                <strong>Внимание:</strong> Эта книга имеет {connections.length} связ
                {connections.length === 1
                  ? "ь"
                  : connections.length > 1 && connections.length < 5
                    ? "и"
                    : "ей"}{" "}
                с другими книгами. Удаление этой книги также удалит{" "}
                {connections.length === 1 ? "эту связь" : "эти связи"} из графа.
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} className="flex-1">
            <Trash2 className="h-4 w-4" />
            Удалить книгу
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
