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
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    }

    if (!formData.author.trim()) {
      newErrors.author = "Author is required";
    } else if (formData.author.trim().length < 2) {
      newErrors.author = "Author must be at least 2 characters";
    }

    if (formData.year) {
      const yearNum = parseInt(formData.year, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum)) {
        newErrors.year = "Year must be a valid number";
      } else if (yearNum < 1000 || yearNum > currentYear + 10) {
        newErrors.year = `Year must be between 1000 and ${currentYear + 10}`;
      }
    }

    if (formData.isbn) {
      const cleanIsbn = formData.isbn.replace(/[-\s]/g, "");
      if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
        newErrors.isbn = "ISBN must be 10 or 13 digits";
      } else if (!/^\d+$/.test(cleanIsbn)) {
        newErrors.isbn = "ISBN must contain only numbers";
      }
    }

    if (formData.themes.length === 0) {
      newErrors.themes = "Please select at least one theme";
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
      console.error("Error saving book:", error);
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
            {isEditing ? "Edit Book" : "Add New Book"}
          </h3>
          <p className="text-sm text-purple-300/70">
            {isEditing
              ? "Update the book information below"
              : "Fill in the details to add a new book to your library"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          id="title"
          label="Title"
          required
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          error={errors.title}
          placeholder="Enter book title"
        />

        <Input
          id="author"
          label="Author"
          required
          value={formData.author}
          onChange={(e) => handleChange("author", e.target.value)}
          error={errors.author}
          placeholder="Enter author name"
        />

        <Input
          id="year"
          label="Publication Year"
          type="number"
          value={formData.year}
          onChange={(e) => handleChange("year", e.target.value)}
          error={errors.year}
          placeholder="e.g., 2024"
        />

        <Input
          id="isbn"
          label="ISBN"
          value={formData.isbn}
          onChange={(e) => handleChange("isbn", e.target.value)}
          error={errors.isbn}
          placeholder="e.g., 978-0-123456-78-9"
          helperText="10 or 13 digits"
        />
      </div>

      <Textarea
        id="description"
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        placeholder="Brief description of the book..."
        rows={4}
      />

      <MultiSelect
        label="Themes"
        required
        options={themeOptions}
        value={formData.themes}
        onChange={(value) => handleChange("themes", value)}
        error={errors.themes}
        placeholder="Select one or more themes"
        helperText="Choose themes that best describe this book"
      />

      <Textarea
        id="notes"
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
        placeholder="Personal notes, thoughts, or highlights..."
        rows={4}
      />

      <div className="flex gap-3 pt-4 border-t border-purple-500/30">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : isEditing ? "Update Book" : "Add Book"}
        </Button>
      </div>
    </form>
  );
}
