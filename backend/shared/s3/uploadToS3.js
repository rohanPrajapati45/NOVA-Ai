import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "./s3.js";
import crypto from "crypto";

/**
 * Uploads a binary buffer to the private S3 bucket.
 *
 * Returns the S3 object KEY (not a public URL) — the bucket blocks all public
 * access, so presigned URLs must be generated via getFromS3.js whenever the
 * file needs to be served to a client.
 *
 * @param {Object} params
 * @param {Buffer} params.buffer - The file binary content
 * @param {string} params.filename - Original name to sanitize and prefix
 * @param {string} params.contentType - MIME type (e.g. 'application/pdf', 'image/jpeg')
 * @returns {Promise<string>} The unique S3 Key under which the object is stored
 */
export const uploadToS3 = async ({ buffer, filename, contentType }) => {
  try {
    if (!buffer) throw new Error("S3 Upload Error: Buffer is required.");
    if (!filename) throw new Error("S3 Upload Error: Filename is required.");

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
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
    throw new Error(`S3 Upload failed for "${filename}": ${error.message}`);
  }
};
