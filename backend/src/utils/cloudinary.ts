import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || 'dvkzm2byn',
  api_key: process.env.CLOUD_API_KEY || '536687136721888',
  api_secret: process.env.CLOUD_API_SECRET || 'MDpARaAtC0hyTxKLqPOGaff5gW8',
});

/**
 * Upload a file buffer to Cloudinary
 * @param file - Multer file object
 * @param folder - Optional folder name in Cloudinary
 * @returns Promise with the uploaded image URL
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = 'streakup'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed: No result from Cloudinary'));
        }
      }
    );

    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    bufferStream.pipe(uploadStream);
  });
};

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of Multer file objects
 * @param folder - Optional folder name in Cloudinary
 * @returns Promise with array of uploaded image URLs
 */
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = 'streakup'
): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete an image from Cloudinary by URL
 * @param imageUrl - The Cloudinary URL of the image to delete
 */
export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from URL
    const publicIdMatch = imageUrl.match(/\/([^/]+)\/([^/]+)\.(jpg|jpeg|png|gif|webp)/i);
    if (publicIdMatch) {
      const publicId = `${publicIdMatch[1]}/${publicIdMatch[2]}`;
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

