
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { backblazeConfig } from "../backblaze.config.ts";

// Ensure endpoint has protocol to avoid SDK ambiguity
const endpointUrl = backblazeConfig.endpoint.startsWith('http') 
  ? backblazeConfig.endpoint 
  : `https://${backblazeConfig.endpoint}`;

// Initialize S3 Client
const s3Client = new S3Client({
  endpoint: endpointUrl,
  region: backblazeConfig.region,
  credentials: {
    accessKeyId: backblazeConfig.accessKeyId,
    secretAccessKey: backblazeConfig.secretAccessKey,
  },
  // Force path style for better compatibility with B2
  forcePathStyle: true,
});

/**
 * Uploads a file to Backblaze B2.
 * @param file The file object to upload
 * @param folder The folder path (e.g., 'homework', 'resources')
 * @returns Object containing file details including the public URL
 */
export const uploadFileToBackblaze = async (file: File, folder: string = 'general'): Promise<{ fileName: string; fileUrl: string; fileId: string }> => {
  
  // 1. Check if config is set
  if (backblazeConfig.bucketName === 'REPLACE_WITH_YOUR_BUCKET_NAME') {
    throw new Error("Backblaze Configuration Missing. Please update backblaze.config.ts");
  }

  // 2. Prepare file name (timestamp to avoid collisions)
  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const key = `${folder}/${timestamp}_${cleanFileName}`;

  // 3. Prepare File Body as Uint8Array
  // CRITICAL FIX: The AWS SDK v3 attempts to use 'fs' (Node file system) if passed a raw File object
  // in certain shimmed environments. By converting to ArrayBuffer -> Uint8Array,
  // we force the SDK to treat it as a memory buffer, bypassing the fs.readFile check.
  const arrayBuffer = await file.arrayBuffer();
  const fileData = new Uint8Array(arrayBuffer);

  // 4. Prepare Upload Command
  const command = new PutObjectCommand({
    Bucket: backblazeConfig.bucketName,
    Key: key,
    Body: fileData, // Passing Uint8Array instead of File object
    ContentType: file.type,
  });

  try {
    // 5. Send Upload Request
    await s3Client.send(command);

    // 6. Construct Public URL
    // We will use the standard S3 path style which usually works for B2 if public:
    const standardUrl = `${endpointUrl}/${backblazeConfig.bucketName}/${key}`;

    return {
      fileName: cleanFileName,
      fileUrl: standardUrl,
      fileId: key
    };

  } catch (error) {
    console.error("Backblaze Upload Error:", error);
    throw new Error("Failed to upload file to Cloud Storage. Please check your internet connection.");
  }
};

/**
 * Placeholder for delete (Deleting from client-side via keys is risky, usually handled by lifecycle rules or backend)
 */
export const deleteFileFromBackblaze = async (fileKey: string) => {
    // Implementing delete via client-side keys is possible but highly discouraged for production due to risk.
    // For this MVP, we will just log it.
    console.warn("Skipping file deletion from B2 to prevent accidental data loss in MVP mode.", fileKey);
};
