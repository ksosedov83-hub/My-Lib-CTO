export interface Book {
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

export interface Connection {
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

export type ConnectionType =
  | "influences"
  | "references"
  | "contradicts"
  | "expands"
  | "similar-theme"
  | "chronological"
  | "author-connection"
  | "custom";

export interface Theme {
  id: string;
  name: string;
  color: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CoverImage {
  id: string;
  url: string;
  filename: string;
  uploadedAt: number;
  width?: number;
  height?: number;
  size: number;
}

export interface PDFAttachment {
  id: string;
  url: string;
  filename: string;
  uploadedAt: number;
  size: number;
  pageCount?: number;
  extractedText?: string;
  processingStatus: "pending" | "processing" | "completed" | "error";
}

export interface ExtractedNote {
  id: string;
  content: string;
  page?: number;
  type: "highlight" | "annotation" | "bookmark" | "summary";
  color?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface LibraryState {
  books: Book[];
  connections: Connection[];
  themes: Theme[];
  version: number;
}
