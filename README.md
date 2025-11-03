# Cosmic App

A Next.js 14+ application with a cosmic/space-themed UI featuring graph visualization capabilities.

## Features

- **Next.js 14+** with App Router and TypeScript
- **Tailwind CSS** for utility-first styling with custom cosmic color palette
- **Cosmic Background Theme** with animated starfield and gradient effects
- **Responsive Layout Shell** with header, sidebar, and main content area
- **State Management** with Zustand
- **Graph Visualization** powered by react-force-graph (2D and 3D support)
- **Icons** via Lucide React
- **Code Quality** with ESLint and Prettier

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the cosmic-themed application.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
/src
  /app                    # Next.js App Router pages
    layout.tsx            # Root layout with fonts
    page.tsx              # Home page
    globals.css           # Global styles with cosmic theme
  /components             # React components
    AppShell.tsx          # Main layout shell with header/sidebar
  /data                   # Seed data and initial state
    initialData.ts        # 14 seed books, themes, and connections
  /lib                    # Utility libraries
    /pdf                  # PDF processing (future implementation)
    /uploads              # File upload handling (future implementation)
  /stores                 # Zustand state stores
    useAppStore.ts        # App UI state (sidebar, theme)
    useLibraryStore.ts    # Library data store with persistence
  /types                  # TypeScript type definitions
    index.ts              # Core types (Book, Connection, Theme, etc.)
```

## Tech Stack

- **Framework:** Next.js 16.0.1
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Custom with Tailwind
- **State Management:** Zustand
- **Graph Visualization:** react-force-graph-2d, react-force-graph-3d, Three.js
- **Icons:** Lucide React
- **Code Quality:** ESLint, Prettier
- **Fonts:** Geist Sans & Geist Mono

## Cosmic Theme

The application features a custom cosmic/space theme with:

- Dark purple and blue gradient backgrounds
- Animated starfield with twinkling effect
- Glowing borders and shadow effects
- Responsive design across all breakpoints
- Custom color palette inspired by deep space

## Development

The app is fully typed with TypeScript and follows Next.js best practices. All components are modular and reusable.

### Adding New Pages

Create new pages in the `/src/app` directory following the App Router conventions.

### Using State Management

The application uses Zustand for state management with two main stores:

#### UI State (useAppStore)

```typescript
import { useAppStore } from "@/stores/useAppStore";

const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useAppStore();
```

#### Library Data (useLibraryStore)

The library store manages books, connections, and themes with full CRUD operations and localStorage persistence:

```typescript
import { useLibraryStore } from "@/stores/useLibraryStore";

// Get data
const books = useLibraryStore((state) => state.books);
const themes = useLibraryStore((state) => state.themes);
const connections = useLibraryStore((state) => state.connections);

// CRUD operations
const { addBook, updateBook, deleteBook, getBook } = useLibraryStore();
const { addConnection, updateConnection, deleteConnection } = useLibraryStore();
const { addTheme, updateTheme, deleteTheme } = useLibraryStore();

// Selectors
const { getBooksByTheme, getConnectionsByBook } = useLibraryStore();

// Example: Add a new book
const newBook = addBook({
  title: "New Book",
  author: "Author Name",
  year: 2024,
  themes: ["Philosophy"],
  description: "Book description",
});

// Example: Get books by theme
const philosophyBooks = getBooksByTheme("Philosophy");
```

#### Features

- **Seed Data**: Initializes with 14 classic books, 8 themes, and 12 connections
- **LocalStorage Persistence**: State automatically persists across page reloads with debounced writes (1s delay)
- **Schema Versioning**: Supports data migration between schema versions
- **Type Safety**: Fully typed with TypeScript interfaces

### Data Model

The application uses the following core data types:

- **Book**: Represents a book with metadata, themes, notes, and attachments (cover images, PDFs, extracted notes)
- **Connection**: Links between books with type (influences, references, contradicts, etc.), strength, and notes
- **Theme**: Categories/tags for organizing books with names, colors, and descriptions
- **Attachment Types**: CoverImage, PDFAttachment, ExtractedNote for future media handling

See `/src/types/index.ts` for complete type definitions.

### Future Features

#### PDF Processing (`/src/lib/pdf`)

Scaffolding is in place for future PDF ingestion:
- Upload and attach PDF files to books
- Extract text content from PDFs
- Parse annotations, highlights, and bookmarks
- Generate thumbnails and previews

See `/src/lib/pdf/README.md` for implementation details.

#### File Uploads (`/src/lib/uploads`)

Scaffolding for cover image and file uploads:
- Image upload with validation and optimization
- Cloud storage integration (Vercel Blob, S3, Cloudinary)
- Thumbnail generation and compression
- Progress tracking

See `/src/lib/uploads/README.md` for implementation details.

## License

MIT
