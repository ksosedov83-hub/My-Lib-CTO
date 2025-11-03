"use client";

import { useLibraryStore } from "@/stores/useLibraryStore";
import { useState } from "react";

export default function LibraryTestPage() {
  const books = useLibraryStore((state) => state.books);
  const connections = useLibraryStore((state) => state.connections);
  const themes = useLibraryStore((state) => state.themes);
  const { addBook, deleteBook, getBooksByTheme, resetToInitialData } = useLibraryStore();

  const [selectedTheme, setSelectedTheme] = useState<string>("");

  const handleAddBook = () => {
    addBook({
      title: `Test Book ${Date.now()}`,
      author: "Test Author",
      year: 2024,
      themes: ["Philosophy"],
      description: "This is a test book added through the UI",
    });
  };

  const filteredBooks = selectedTheme ? getBooksByTheme(selectedTheme) : books;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0118] to-[#1a0f2e] p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-4xl font-bold text-purple-400">Library Store Test Page</h1>

        <div className="mb-8 flex gap-4">
          <button
            onClick={handleAddBook}
            className="rounded-lg bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-700"
          >
            Add Test Book
          </button>
          <button
            onClick={resetToInitialData}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"
          >
            Reset to Initial Data
          </button>
        </div>

        <div className="mb-8 rounded-lg bg-purple-900/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold">Store Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-purple-800/30 p-4">
              <div className="text-3xl font-bold text-purple-400">{books.length}</div>
              <div className="text-sm text-purple-300">Books</div>
            </div>
            <div className="rounded-lg bg-blue-800/30 p-4">
              <div className="text-3xl font-bold text-blue-400">{connections.length}</div>
              <div className="text-sm text-blue-300">Connections</div>
            </div>
            <div className="rounded-lg bg-pink-800/30 p-4">
              <div className="text-3xl font-bold text-pink-400">{themes.length}</div>
              <div className="text-sm text-pink-300">Themes</div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-purple-900/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold">Themes</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTheme("")}
              className={`rounded-full px-4 py-2 font-semibold ${
                selectedTheme === "" ? "bg-purple-600" : "bg-purple-800/50 hover:bg-purple-700/50"
              }`}
            >
              All ({books.length})
            </button>
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.name)}
                className={`rounded-full px-4 py-2 font-semibold transition-colors ${
                  selectedTheme === theme.name
                    ? "ring-2 ring-white"
                    : "hover:ring-2 hover:ring-white/50"
                }`}
                style={{
                  backgroundColor: selectedTheme === theme.name ? theme.color : `${theme.color}80`,
                }}
              >
                {theme.name} ({getBooksByTheme(theme.name).length})
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-purple-900/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold">
            {selectedTheme ? `Books in ${selectedTheme}` : "All Books"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="rounded-lg bg-gradient-to-br from-purple-800/30 to-blue-800/30 p-4 backdrop-blur-sm"
              >
                <h3 className="mb-2 text-lg font-bold text-purple-300">{book.title}</h3>
                <p className="mb-2 text-sm text-purple-200">{book.author}</p>
                {book.year && <p className="mb-2 text-xs text-purple-300">Year: {book.year}</p>}
                <div className="mb-3 flex flex-wrap gap-1">
                  {book.themes.map((themeName) => {
                    const theme = themes.find((t) => t.name === themeName);
                    return (
                      <span
                        key={themeName}
                        className="rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: theme ? `${theme.color}40` : "#7c3aed40",
                          color: theme?.color || "#7c3aed",
                        }}
                      >
                        {themeName}
                      </span>
                    );
                  })}
                </div>
                {book.description && (
                  <p className="mb-3 text-xs text-purple-200/80">{book.description}</p>
                )}
                <button
                  onClick={() => deleteBook(book.id)}
                  className="w-full rounded bg-red-600/50 px-3 py-1 text-xs font-semibold hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-purple-900/20 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold">Connections</h2>
          <div className="space-y-2">
            {connections.map((conn) => {
              const sourceBook = books.find((b) => b.id === conn.sourceId);
              const targetBook = books.find((b) => b.id === conn.targetId);
              return (
                <div
                  key={conn.id}
                  className="rounded-lg bg-gradient-to-r from-cyan-800/20 to-blue-800/20 p-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-cyan-300">
                      {sourceBook?.title || "Unknown"}
                    </span>
                    <span className="rounded bg-cyan-600/50 px-2 py-1 text-xs font-semibold">
                      {conn.type}
                    </span>
                    <span className="font-semibold text-cyan-300">
                      {targetBook?.title || "Unknown"}
                    </span>
                  </div>
                  {conn.label && <p className="mt-1 text-xs text-cyan-200/70">{conn.label}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-yellow-900/20 p-6 backdrop-blur-sm">
          <h2 className="mb-2 text-xl font-bold text-yellow-400">Persistence Test</h2>
          <p className="text-sm text-yellow-200">
            Try adding or deleting books, then refresh the page. Your changes should persist thanks
            to localStorage integration with debounced writes (1s delay).
          </p>
        </div>
      </div>
    </div>
  );
}
