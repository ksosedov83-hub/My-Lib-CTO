import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Book, Connection, Theme, LibraryState } from "@/types";
import {
  initialBooks,
  initialConnections,
  initialThemes,
  SCHEMA_VERSION,
} from "@/data/initialData";

interface LibraryActions {
  addBook: (book: Omit<Book, "id" | "createdAt" | "updatedAt">) => Book;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  getBook: (id: string) => Book | undefined;
  getBooksByTheme: (theme: string) => Book[];
  addConnection: (connection: Omit<Connection, "id" | "createdAt" | "updatedAt">) => Connection;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  getConnection: (id: string) => Connection | undefined;
  getConnectionsByBook: (bookId: string) => Connection[];
  addTheme: (theme: Omit<Theme, "id" | "createdAt" | "updatedAt">) => Theme;
  updateTheme: (id: string, updates: Partial<Theme>) => void;
  deleteTheme: (id: string) => void;
  getTheme: (id: string) => Theme | undefined;
  resetToInitialData: () => void;
}

type LibraryStore = LibraryState & LibraryActions;

const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const createInitialState = (): LibraryState => ({
  books: initialBooks,
  connections: initialConnections,
  themes: initialThemes,
  version: SCHEMA_VERSION,
});

let saveTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_DELAY = 1000;

const debouncedStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      localStorage.setItem(name, value);
      saveTimeout = null;
    }, DEBOUNCE_DELAY);
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(name);
  },
};

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      addBook: (bookData) => {
        const newBook: Book = {
          ...bookData,
          id: generateId("book"),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          books: [...state.books, newBook],
        }));
        return newBook;
      },

      updateBook: (id, updates) => {
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id ? { ...book, ...updates, updatedAt: Date.now() } : book
          ),
        }));
      },

      deleteBook: (id) => {
        set((state) => ({
          books: state.books.filter((book) => book.id !== id),
          connections: state.connections.filter(
            (conn) => conn.sourceId !== id && conn.targetId !== id
          ),
        }));
      },

      getBook: (id) => {
        return get().books.find((book) => book.id === id);
      },

      getBooksByTheme: (theme) => {
        return get().books.filter((book) => book.themes.includes(theme));
      },

      addConnection: (connectionData) => {
        const newConnection: Connection = {
          ...connectionData,
          id: generateId("conn"),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          connections: [...state.connections, newConnection],
        }));
        return newConnection;
      },

      updateConnection: (id, updates) => {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === id ? { ...conn, ...updates, updatedAt: Date.now() } : conn
          ),
        }));
      },

      deleteConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== id),
        }));
      },

      getConnection: (id) => {
        return get().connections.find((conn) => conn.id === id);
      },

      getConnectionsByBook: (bookId) => {
        return get().connections.filter(
          (conn) => conn.sourceId === bookId || conn.targetId === bookId
        );
      },

      addTheme: (themeData) => {
        const newTheme: Theme = {
          ...themeData,
          id: generateId("theme"),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          themes: [...state.themes, newTheme],
        }));
        return newTheme;
      },

      updateTheme: (id, updates) => {
        set((state) => ({
          themes: state.themes.map((theme) =>
            theme.id === id ? { ...theme, ...updates, updatedAt: Date.now() } : theme
          ),
        }));
      },

      deleteTheme: (id) => {
        set((state) => ({
          themes: state.themes.filter((theme) => theme.id !== id),
        }));
      },

      getTheme: (id) => {
        return get().themes.find((theme) => theme.id === id);
      },

      resetToInitialData: () => {
        set(createInitialState());
      },
    }),
    {
      name: "library-storage",
      storage: createJSONStorage(() => debouncedStorage),
      version: SCHEMA_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as LibraryState & LibraryActions;

        if (version < SCHEMA_VERSION) {
          console.log(`Migrating library store from version ${version} to ${SCHEMA_VERSION}`);

          return {
            ...state,
            version: SCHEMA_VERSION,
          };
        }

        return state;
      },
      partialize: (state) => ({
        books: state.books,
        connections: state.connections,
        themes: state.themes,
        version: state.version,
      }),
    }
  )
);
