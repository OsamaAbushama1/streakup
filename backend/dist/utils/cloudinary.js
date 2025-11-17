"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadMultipleToCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
// Configure Cloudinary
cloudinary_1.v2.config({
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
const uploadToCloudinary = async (file, folder = 'streakup') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: folder,
            resource_type: 'auto',
        }, (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error);
                reject(error);
            }
            else if (result) {
                resolve(result.secure_url);
            }
            else {
                reject(new Error('Upload failed: No result from Cloudinary'));
            }
        });
        // Convert buffer to stream
        const bufferStream = new stream_1.Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Upload multiple files to Cloudinary
 * @param files - Array of Multer file objects
 * @param folder - Optional folder name in Cloudinary
 * @returns Promise with array of uploaded image URLs
 */
const uploadMultipleToCloudinary = async (files, folder = 'streakup') => {
    const uploadPromises = files.map((file) => (0, exports.uploadToCloudinary)(file, folder));
    return Promise.all(uploadPromises);
};
exports.uploadMultipleToCloudinary = uploadMultipleToCloudinary;
/**
 * Delete an image from Cloudinary by URL
 * @param imageUrl - The Cloudinary URL of the image to delete
 */
const deleteFromCloudinary = async (imageUrl) => {
    try {
        // Extract public_id from URL
        const publicIdMatch = imageUrl.match(/\/([^/]+)\/([^/]+)\.(jpg|jpeg|png|gif|webp)/i);
        if (publicIdMatch) {
            const publicId = `${publicIdMatch[1]}/${publicIdMatch[2]}`;
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
