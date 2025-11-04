"use client";

import { useState, FormEvent } from "react";
import { Book } from "@/types";
import { useLibraryStore } from "@/stores/useLibraryStore";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import MultiSelect from "@/components/ui/MultiSelect";
import Button from "@/components/ui/Button";
import { BookOpen, Save } from "lucide-react";

interface BookFormProps {
  book?: Book;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormErrors {
  title?: string;
  author?: string;
  year?: string;
  isbn?: string;
  themes?: string;
}

export default function BookForm({ book, onSuccess, onCancel }: BookFormProps) {
  const addBook = useLibraryStore((state) => state.addBook);
  const updateBook = useLibraryStore((state) => state.updateBook);
  const themes = useLibraryStore((state) => state.themes);

  const isEditing = !!book;

  const [formData, setFormData] = useState({
    title: book?.title || "",
    author: book?.author || "",
    year: book?.year?.toString() || "",
    isbn: book?.isbn || "",
    description: book?.description || "",
    themes: book?.themes || [],
    notes: book?.notes || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Название обязательно";
    } else if (formData.title.trim().length < 2) {
      newErrors.title = "Название должно быть не менее 2 символов";
    }

    if (!formData.author.trim()) {
      newErrors.author = "Автор обязателен";
    } else if (formData.author.trim().length < 2) {
      newErrors.author = "Имя автора должно быть не менее 2 символов";
    }

    if (formData.year) {
      const yearNum = parseInt(formData.year, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum)) {
        newErrors.year = "Год должен быть числом";
      } else if (yearNum < 1000 || yearNum > currentYear + 10) {
        newErrors.year = `Год должен быть между 1000 и ${currentYear + 10}`;
      }
    }

    if (formData.isbn) {
      const cleanIsbn = formData.isbn.replace(/[-\s]/g, "");
      if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
        newErrors.isbn = "ISBN должен содержать 10 или 13 цифр";
      } else if (!/^\d+$/.test(cleanIsbn)) {
        newErrors.isbn = "ISBN должен содержать только цифры";
      }
    }

    if (formData.themes.length === 0) {
      newErrors.themes = "Пожалуйста, выберите хотя бы одну тему";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        isbn: formData.isbn.trim() || undefined,
        description: formData.description.trim() || undefined,
        themes: formData.themes,
        notes: formData.notes.trim() || undefined,
      };

      if (isEditing) {
        updateBook(book.id, bookData);
      } else {
        addBook(bookData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Ошибка сохранения книги:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const themeOptions = themes.map((theme) => ({
    value: theme.name,
    label: theme.name,
    color: theme.color,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-lg bg-purple-500/20 p-3">
          <BookOpen className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-purple-100">
            {isEditing ? "Редактировать книгу" : "Добавить новую книгу"}
          </h3>
          <p className="text-sm text-purple-300/70">
            {isEditing
              ? "Обновите информацию о книге ниже"
              : "Заполните детали, чтобы добавить новую книгу в библиотеку"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          id="title"
          label="Название"
          required
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          error={errors.title}
          placeholder="Введите название книги"
        />

        <Input
          id="author"
          label="Автор"
          required
          value={formData.author}
          onChange={(e) => handleChange("author", e.target.value)}
          error={errors.author}
          placeholder="Введите имя автора"
        />

        <Input
          id="year"
          label="Год издания"
          type="number"
          value={formData.year}
          onChange={(e) => handleChange("year", e.target.value)}
          error={errors.year}
          placeholder="напр., 2024"
        />

        <Input
          id="isbn"
          label="ISBN"
          value={formData.isbn}
          onChange={(e) => handleChange("isbn", e.target.value)}
          error={errors.isbn}
          placeholder="напр., 978-0-123456-78-9"
          helperText="10 или 13 цифр"
        />
      </div>

      <Textarea
        id="description"
        label="Описание"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        placeholder="Краткое описание книги..."
        rows={4}
      />

      <MultiSelect
        label="Темы"
        required
        options={themeOptions}
        value={formData.themes}
        onChange={(value) => handleChange("themes", value)}
        error={errors.themes}
        placeholder="Выберите одну или несколько тем"
        helperText="Выберите темы, которые лучше всего описывают эту книгу"
      />

      <Textarea
        id="notes"
        label="Заметки"
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
        placeholder="Личные заметки, мысли или выделенное..."
        rows={4}
      />

      <div className="flex gap-3 pt-4 border-t border-purple-500/30">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? "Сохранение..." : isEditing ? "Обновить книгу" : "Добавить книгу"}
        </Button>
      </div>
    </form>
  );
}
