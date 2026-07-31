import { S3Client } from "@aws-sdk/client-s3";

// Define the required environment variables for S3 operations
const REQUIRED_ENV_VARS = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
];

// Validate presence of required environment variables on startup/module load
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(
    `[S3 CONFIG ERROR] Missing required S3 environment variables: ${missingEnvVars.join(
      ", "
    )}. Please ensure they are defined in your environment/.env file.`
  );
}

// Export the bucket name centralizing environment variable reading
export const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Initialize and export the single S3Client instance
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
