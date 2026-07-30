import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "./s3.js";

/**
 * Generates a temporary, secure presigned GET URL for an S3 object key.
 *
 * WHY A PRESIGNED URL IS NEEDED:
 * Since public access to the bucket is blocked, direct access via public HTTP URLs is impossible.
 * A presigned URL temporarily delegates access authority to retrieve the object.
 *
 * DEFAULT EXPIRY (3600 seconds / 1 hour):
 * A 1-hour expiry is a standard secure default. Since files are generally loaded on-demand
 * when a user opens a conversation or fetches messages, generating fresh links with a 1-hour validity
 * prevents unauthorized long-term hotlinking of private content. Callers can override this default
 * if a specific lifecycle is needed (e.g. sharing download links).
 *
 * @param {string} key - The unique S3 Object Key (e.g. returned by uploadToS3)
 * @param {number} [expiresInSeconds=3600] - Duration in seconds until the URL expires (default 1 hour)
 * @returns {Promise<string>} The temporary presigned URL string
 */
export const getSignedUrlForKey = async (key, expiresInSeconds = 3600) => {
  try {
    if (!key) {
      throw new Error("S3 Retrieval Error: Key is required.");
    }

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
