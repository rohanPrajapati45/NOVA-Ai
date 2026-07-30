import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "./s3.js";
import crypto from "crypto";

/**
 * Uploads a binary buffer to the private S3 bucket.
 * 
 * WHY WE RETURN THE KEY (NOT A PUBLIC URL):
 * The S3 bucket is configured to block all public access for security. Storing or returning
 * a raw public HTTP URL (e.g. https://bucket.s3.amazonaws.com/key) would result in Access Denied
 * errors when accessed by the client. Instead, we store and return the unique S3 Object Key.
 * Whenever the file needs to be displayed or fetched, a temporary presigned URL is generated
 * dynamically using this Key (via getFromS3.js), keeping the data private and secure.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - The file binary content
 * @param {string} params.filename - Original name of the file to sanitize and prefix
 * @param {string} params.contentType - MIME type of the file (e.g. 'image/png', 'application/pdf')
 * @returns {Promise<string>} The unique S3 Key under which the object is stored
 */
export const uploadToS3 = async ({ buffer, filename, contentType }) => {
  try {
    if (!buffer) {
      throw new Error("S3 Upload Error: Buffer is required.");
    }
    if (!filename) {
      throw new Error("S3 Upload Error: Filename is required.");
    }

    // Sanitize filename to prevent invalid characters in S3 keys
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    // Generate a unique object key using crypto.randomUUID() to avoid collisions
    const key = `uploads/${crypto.randomUUID()}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    console.log(`[S3 SUCCESS] File uploaded successfully. Key: "${key}"`);
    return key;
  } catch (error) {
    console.error(`[S3 UPLOAD FAILED] Error uploading file "${filename}":`, error.message);
    // Throw a clear error so the caller can handle the failure gracefully
    throw new Error(`S3 Upload failed for "${filename}": ${error.message}`);
  }
};
