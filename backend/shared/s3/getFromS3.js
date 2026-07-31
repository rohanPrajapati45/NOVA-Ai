import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "./s3.js";

/**
 * Generates a temporary, secure presigned GET URL for an S3 object key.
 *
 * @param {string} key - The unique S3 Object Key (e.g. returned by uploadToS3)
 * @param {number} [expiresInSeconds=3600] - Duration until the URL expires (default 1 hour)
 * @returns {Promise<string>} The temporary presigned URL string
 */
export const getSignedUrlForKey = async (key, expiresInSeconds = 3600) => {
  try {
    if (!key) throw new Error("S3 Retrieval Error: Key is required.");

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expiresInSeconds,
    });

    return signedUrl;
  } catch (error) {
    console.error(`[S3 PRESIGN FAILED] Error generating signed URL for key "${key}":`, error.message);
    throw new Error(`S3 Presign failed for key "${key}": ${error.message}`);
  }
};
