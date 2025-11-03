# Library Store Usage Guide

## Overview

The library store is a fully-featured Zustand store with TypeScript types, localStorage persistence, and CRUD operations for books, connections, and themes.

## Quick Start

```typescript
import { useLibraryStore } from "@/stores/useLibraryStore";

function MyComponent() {
  // Access state
  const books = useLibraryStore((state) => state.books);
  const themes = useLibraryStore((state) => state.themes);
  const connections = useLibraryStore((state) => state.connections);

  // Access actions
  const { addBook, updateBook, deleteBook } = useLibraryStore();

  // Use the store
  const handleAddBook = () => {
    addBook({
      title: "New Book",
      author: "Author Name",
      year: 2024,
      themes: ["Philosophy"],
    });
  };

  return <div>...</div>;
}
```

## Features

### ✅ Seed Data

The store initializes with:
- **14 classic books** (Philosophy, Literature, Science, etc.)
- **8 themes** (Philosophy, Science, Literature, History, Psychology, Politics, Ethics, Society)
- **12 connections** showing relationships between books

### ✅ CRUD Operations

#### Books

```typescript
// Create
const newBook = addBook({
  title: "Being and Time",
  author: "Martin Heidegger",
  year: 1927,
  themes: ["Philosophy"],
  description: "Existential investigation of Being",
  notes: "Dense but foundational text",
});

// Read
const book = getBook("book-1");
const philosophyBooks = getBooksByTheme("Philosophy");

// Update
updateBook("book-1", {
  notes: "Updated notes",
  themes: ["Philosophy", "Ethics"],
});

// Delete
deleteBook("book-1");
```

#### Connections

```typescript
// Create
const newConnection = addConnection({
  sourceId: "book-1",
  targetId: "book-2",
  type: "influences",
  strength: 0.8,
  label: "Philosophical influence",
  notes: "Connection details",
});

// Read
const connection = getConnection("conn-1");
const bookConnections = getConnectionsByBook("book-1");

// Update
updateConnection("conn-1", {
  strength: 0.9,
  notes: "Updated connection notes",
});

// Delete
deleteConnection("conn-1");
```

#### Themes

```typescript
// Create
const newTheme = addTheme({
  name: "Economics",
  color: "#f59e0b",
  description: "Economic theory and practice",
});

// Read
const theme = getTheme("theme-1");

// Update
updateTheme("theme-1", {
  color: "#8b5cf6",
  description: "Updated description",
});

// Delete
deleteTheme("theme-1");
```

### ✅ LocalStorage Persistence

- Automatically saves state to localStorage
- **Debounced writes** (1 second delay) to prevent excessive saves
- Survives page reloads
- Schema versioning for migrations

### ✅ Schema Versioning

Current version: **1**

The store includes migration logic to handle schema changes:

```typescript
version: SCHEMA_VERSION,
migrate: (persistedState: unknown, version: number) => {
  if (version < SCHEMA_VERSION) {
    // Migration logic here
    console.log(`Migrating from version ${version} to ${SCHEMA_VERSION}`);
  }
  return state;
}
```

### ✅ Type Safety

All data structures are fully typed:

```typescript
interface Book {
  id: string;
  title: string;
  author: string;
  year?: number;
  isbn?: string;
  description?: string;
  themes: string[];
  notes?: string;
  coverImage?: CoverImage;
  pdfAttachment?: PDFAttachment;
  extractedNotes?: ExtractedNote[];
  createdAt: number;
  updatedAt: number;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  strength: number;
  label?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

interface Theme {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}
```

## Testing

Visit `/library-test` to see the store in action:
- View all books, connections, and themes
- Add test books
- Delete books
- Filter by theme
- Reset to initial data
- Test persistence by refreshing the page

## Reset Data

```typescript
const { resetToInitialData } = useLibraryStore();

// Reset to seed data
resetToInitialData();
```

## Advanced Usage

### Selective State Access

Use selectors to avoid unnecessary re-renders:

```typescript
// Only re-renders when books change
const books = useLibraryStore((state) => state.books);

// Only re-renders when a specific book changes
const book = useLibraryStore((state) => state.books.find((b) => b.id === "book-1"));

// Access multiple pieces of state
const { books, themes } = useLibraryStore((state) => ({
  books: state.books,
  themes: state.themes,
}));
```

### Outside React Components

```typescript
import { useLibraryStore } from "@/stores/useLibraryStore";

// Get state
const currentState = useLibraryStore.getState();
console.log(currentState.books);

// Subscribe to changes
const unsubscribe = useLibraryStore.subscribe((state) => {
  console.log("State changed:", state);
});

// Call actions
useLibraryStore.getState().addBook({
  title: "New Book",
  author: "Author",
  themes: [],
});
```

## Future Enhancements

The types are already in place for:
- **Cover Images**: Upload and attach cover images to books
- **PDF Attachments**: Attach PDF files to books
- **Extracted Notes**: Store highlights and annotations from PDFs

See `/src/lib/pdf` and `/src/lib/uploads` for implementation scaffolding.
