// A client-side mock for a cloud storage service like Backblaze B2.
// It uses localStorage to persist file data across page reloads and browser tabs, simulating a real storage bucket.
// It stores files as full Data URLs for simplicity and robustness.

// Helper to convert File/Blob to a Base64 Data URL
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const STORAGE_PREFIX = 'mockB2File_';

/**
 * "Uploads" a file by converting it to a Data URL and storing it in localStorage under its own key.
 */
export const uploadFileToMockStorage = async (file: File): Promise<{ fileName: string; fileId: string }> => {
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const fileId = `mock_${Math.random().toString(36).substring(2, 15)}`;
  
  // toBase64 creates a full Data URL: "data:image/png;base64,..."
  const dataUrl = await toBase64(file);
  
  try {
    const key = STORAGE_PREFIX + fileName;
    localStorage.setItem(key, dataUrl);

    // Verification Step: Immediately read back the data to ensure it was saved.
    // This helps diagnose issues with browser storage (e.g., private mode, full storage).
    if (localStorage.getItem(key) === null) {
      console.error("[MockStorage] CRITICAL: Wrote to localStorage but data is not there. This might be a browser issue (e.g., private mode, storage quota).");
      throw new Error("Failed to persist file in local storage.");
    }
  } catch (e) {
    console.error("Failed to write to mock storage", e);
    // Add more context to the error for storage quota issues.
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
       throw new Error("Could not save file. Local storage quota exceeded. Please clear some space or try a smaller file.");
    }
    throw new Error("Could not save file to local storage.");
  }
  
  console.log(`[MockStorage] "Uploaded" ${fileName} to localStorage.`);
  
  return { fileName, fileId };
};

/**
 * "Deletes" a file from localStorage.
 */
export const deleteFileFromMockStorage = async (fileName: string): Promise<void> => {
  localStorage.removeItem(STORAGE_PREFIX + fileName);
  console.log(`[MockStorage] "Deleted" ${fileName} from localStorage.`);
};

/**
 * "Gets a download URL" by retrieving the Data URL directly from localStorage.
 * Includes a retry mechanism to handle potential browser timing issues where
 * data isn't immediately available after being written.
 */
export const getMockFileUrl = async (fileName: string): Promise<string> => {
  const key = STORAGE_PREFIX + fileName;
  
  let dataUrl: string | null = null;
  let attempts = 0;
  const maxAttempts = 5; // Attempt 5 times
  const delay = 50; // 50ms delay between attempts

  while (attempts < maxAttempts) {
    dataUrl = localStorage.getItem(key);
    if (dataUrl) {
      console.log(`[MockStorage] Found file for key "${key}" on attempt ${attempts + 1}.`);
      break; // Found it
    }
    attempts++;
    if (attempts < maxAttempts) {
      console.warn(`[MockStorage] Attempt ${attempts} failed for key "${key}". Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (!dataUrl) {
    console.error(`[MockStorage] File not found for key: "${key}" after ${maxAttempts} attempts.`);
    // This log helps debug by showing what *is* in storage.
    const availableKeys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    console.log('[MockStorage] Available file keys:', availableKeys);
    throw new Error("File not found in mock storage.");
  }
  
  console.log(`[MockStorage] "Retrieved Data URL for" ${fileName}.`);
  return dataUrl;
};
