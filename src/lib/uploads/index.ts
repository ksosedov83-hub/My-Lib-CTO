import { CoverImage } from "@/types";

export interface UploadOptions {
  file: File;
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
}

export class FileUploader {
  private readonly defaultMaxSize = 10 * 1024 * 1024;
  private readonly defaultAllowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  async uploadImage(file: File, options?: Partial<UploadOptions>): Promise<CoverImage> {
    const maxSize = options?.maxSize || this.defaultMaxSize;
    const allowedTypes = options?.allowedTypes || this.defaultAllowedTypes;

    this.validateFile(file, maxSize, allowedTypes);

    throw new Error("Image upload not yet implemented");
  }

  async uploadFile(_file: File, _options?: UploadOptions): Promise<UploadResult> {
    throw new Error("Generic file upload not yet implemented");
  }

  private validateFile(file: File, maxSize: number, allowedTypes: string[]): void {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum of ${maxSize} bytes`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }

  async deleteFile(_url: string): Promise<void> {
    throw new Error("File deletion not yet implemented");
  }

  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image"));
      };

      img.src = objectUrl;
    });
  }

  async compressImage(_file: File, _maxWidth: number, _quality: number = 0.8): Promise<Blob> {
    throw new Error("Image compression not yet implemented");
  }
}

export const fileUploader = new FileUploader();
