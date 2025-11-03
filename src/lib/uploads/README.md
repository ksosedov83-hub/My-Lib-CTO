# File Upload Module

## Overview

This module handles file uploads for cover images, PDFs, and other attachments.

## Future Implementation

### Storage Options

1. **Local Filesystem**
   - Store files in `public/uploads` directory
   - Serve files directly through Next.js static file serving
   - Pros: Simple, no external dependencies
   - Cons: Not scalable, files lost on deployment

2. **Cloud Storage (Recommended)**
   - **AWS S3**: Industry standard, highly scalable
   - **Cloudinary**: Image optimization and CDN built-in
   - **Vercel Blob Storage**: Native integration with Vercel
   - **Supabase Storage**: Open-source alternative with good DX

3. **CDN Integration**
   - Use CloudFront, Cloudflare, or similar for faster delivery
   - Automatic image optimization and resizing
   - Geographic distribution for global users

### Implementation Approach

#### Using Vercel Blob Storage (Recommended for Next.js)

```bash
npm install @vercel/blob
```

```typescript
import { put, del } from '@vercel/blob';

export async function uploadImage(file: File): Promise<CoverImage> {
  const blob = await put(file.name, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  const dimensions = await getImageDimensions(file);

  return {
    id: generateId('img'),
    url: blob.url,
    filename: file.name,
    uploadedAt: Date.now(),
    size: file.size,
    ...dimensions,
  };
}
```

#### Using AWS S3

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

```typescript
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3Client = new S3Client({ region: 'us-east-1' });

export async function uploadToS3(file: File): Promise<string> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${file.name}`,
      Body: file,
      ContentType: file.type,
    },
  });

  const result = await upload.done();
  return result.Location;
}
```

### Features to Implement

1. **File Validation**
   - File type checking (MIME type validation)
   - File size limits
   - Image dimension validation
   - Virus/malware scanning

2. **Image Processing**
   - Automatic resizing and optimization
   - Thumbnail generation
   - Format conversion (e.g., convert to WebP)
   - Compression with quality settings

3. **Progress Tracking**
   - Upload progress indicators
   - Cancellable uploads
   - Retry logic for failed uploads

4. **Security**
   - Signed URLs for temporary access
   - Access control and permissions
   - Content Security Policy headers
   - Rate limiting

5. **Cleanup**
   - Delete unused files
   - Orphan file detection
   - Storage quota management

### Recommended Libraries

- **@vercel/blob**: Vercel's blob storage (easiest for Vercel deployments)
- **@aws-sdk/client-s3**: AWS S3 integration
- **cloudinary**: Image optimization and CDN
- **sharp**: High-performance image processing (server-side)
- **browser-image-compression**: Client-side image compression

### API Routes

Create Next.js API routes for handling uploads:

```typescript
// app/api/upload/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fileUploader } from '@/lib/uploads';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await fileUploader.uploadImage(file);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Environment Variables

Add to `.env.local`:

```bash
# For Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_token_here

# For AWS S3
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name

# For Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Usage Example

```typescript
import { fileUploader } from '@/lib/uploads';

// In a component
const handleFileUpload = async (file: File) => {
  try {
    const coverImage = await fileUploader.uploadImage(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      generateThumbnail: true,
    });

    updateBook(bookId, { coverImage });
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Best Practices

1. Always validate files on both client and server
2. Implement proper error handling and user feedback
3. Use optimistic UI updates for better UX
4. Cache processed images
5. Implement cleanup for abandoned uploads
6. Use environment variables for credentials
7. Test with large files and slow connections
8. Implement proper CORS settings if needed
