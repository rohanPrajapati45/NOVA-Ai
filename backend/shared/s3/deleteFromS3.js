import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "./s3.js";

/**
 * Delete an object from S3 by key.
 * Rethrows on error so the caller can log or decide handling.
 *
 * @param {string} key - S3 object key
 */
export const deleteFromS3 = async (key) => {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    console.log(`[S3] Successfully deleted object key: "${key}"`);
  } catch (err) {
    console.error(`[S3] Failed to delete object key "${key}":`, err.message);
    throw err;
  }
};
