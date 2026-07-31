import { getSignedUrlForKey } from "../../../shared/s3/getFromS3.js";

/**
 * Map of S3-key fields to their corresponding presigned-URL output fields.
 * Adding a new file type (e.g. PPT) requires only adding one entry here —
 * no logic changes needed in the refresh function or calling code.
 */
const S3_KEY_FIELD_MAP = [
  { keyField: "generatedImageKey", urlField: "generatedImageUrl" },
  { keyField: "generatedPdfKey", urlField: "generatedPdfUrl" },
  { keyField: "generatedPptKey", urlField: "generatedPptUrl" },
];

/**
 * For an array of message objects (lean Mongoose documents), generates
 * fresh presigned URLs for every S3-key field that is present.
 *
 * Mutates messages in-place (they must be plain objects, not Mongoose docs)
 * and returns the same array for convenience.
 *
 * @param {Object[]} messages - Array of plain message objects (from .lean())
 * @param {number} [expiresInSeconds=86400] - URL lifetime (default 24 hours)
 * @returns {Promise<Object[]>} The same messages array, augmented with URL fields
 */
export const refreshFileUrlsOnMessages = async (messages, expiresInSeconds = 86400) => {
  for (const msg of messages) {
    for (const { keyField, urlField } of S3_KEY_FIELD_MAP) {
      if (msg[keyField]) {
        try {
          msg[urlField] = await getSignedUrlForKey(msg[keyField], expiresInSeconds);
        } catch (err) {
          console.warn(
            `[refreshFileUrls] Failed to presign "${keyField}" = "${msg[keyField]}":`,
            err.message
          );
          msg[urlField] = null;
        }
      }
    }
  }
  return messages;
};
