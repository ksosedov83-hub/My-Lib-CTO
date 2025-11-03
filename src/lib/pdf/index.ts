import { PDFAttachment, ExtractedNote } from "@/types";

export interface PDFUploadOptions {
  file: File;
  bookId: string;
  extractText?: boolean;
  extractAnnotations?: boolean;
}

export interface PDFProcessingResult {
  attachment: PDFAttachment;
  extractedNotes?: ExtractedNote[];
  extractedText?: string;
}

export class PDFProcessor {
  async uploadPDF(_options: PDFUploadOptions): Promise<PDFProcessingResult> {
    throw new Error("PDF upload not yet implemented");
  }

  async extractText(_pdfUrl: string): Promise<string> {
    throw new Error("PDF text extraction not yet implemented");
  }

  async extractAnnotations(_pdfUrl: string): Promise<ExtractedNote[]> {
    throw new Error("PDF annotation extraction not yet implemented");
  }

  async getPageCount(_file: File): Promise<number> {
    throw new Error("PDF page count not yet implemented");
  }

  async generateThumbnail(_file: File, _page?: number): Promise<string> {
    throw new Error("PDF thumbnail generation not yet implemented");
  }
}

export const pdfProcessor = new PDFProcessor();
