import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary only when env vars are present. This prevents build-time
// failures in environments (like Vercel) where server envs might be missing
// during certain build steps. Callers should handle exceptions when attempting
// to upload without proper configuration.
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !CLOUD_KEY || !CLOUD_SECRET) {
  console.warn('Cloudinary environment variables are not fully configured. PDF uploads will fail on the server unless you add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel environment variables.');
} else {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET,
  });
}

/**
 * Upload a PDF file to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param fileName - Original filename (for public_id)
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadPDFToCloudinary(
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  secure_url: string;
  public_id: string;
  url: string;
  bytes: number;
  format: string;
}> {
  try {
    // Generate a unique public_id using timestamp and original filename
    const timestamp = Date.now();
    // Remove extension and sanitize filename - remove all special characters except dash and underscore
    const cleanFileName = fileName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    const publicId = `${timestamp}-${cleanFileName}`;

    // Upload to Cloudinary with authenticated delivery
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // For non-image files like PDFs
          public_id: publicId,
          folder: 'student-help-pdfs',
          type: 'authenticated', // Use authenticated delivery to bypass security restrictions
          // Optional: Add tags for better organization
          tags: ['pdf', 'student-material'],
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to upload stream
      uploadStream.end(fileBuffer);
    });

    console.log('Cloudinary upload successful:', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      type: result.type,
    });

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      url: result.url,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload PDF to Cloudinary: ${error.message || error}`);
  }
}

/**
 * Delete a PDF file from Cloudinary
 * @param publicId - The public_id of the file to delete
 */
export async function deletePDFFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete PDF from Cloudinary');
  }
}

/**
 * Get a signed URL for secure PDF access
 * @param publicId - The public_id of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export function getSignedPDFUrl(publicId: string, expiresIn: number = 3600): string {
  try {
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;
    
    return cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      type: 'authenticated',
      secure: true,
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Get direct Cloudinary URL for a PDF
 * @param publicId - The public_id of the file
 */
export function getCloudinaryPDFUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true,
  });
}

export default cloudinary;
