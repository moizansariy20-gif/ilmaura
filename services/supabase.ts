
import { createClient } from '@supabase/supabase-js';

// =================================================================
// 🔑 SUPABASE CONFIGURATION
// =================================================================

export const SUPABASE_URL = 'https://lngyxcbbsbqkooybipbj.supabase.co'; 
export const SUPABASE_ANON_KEY = 'sb_publishable_cL7rhsRuQF6A50QTBwhTOQ_V802e0ub';

// =================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Updated Bucket Name: "ilmaura storage" (with space)
const BUCKET_NAME = 'ilmaura storage'; 

/**
 * Uploads a file to Supabase Storage with retry logic for session expiration
 */
export const uploadFileToSupabase = async (file: File, path?: string, retryCount = 0): Promise<{ fileName: string; publicUrl: string }> => {
  try {
    // Use provided path or generate a random one
    let filePath = path;
    
    if (!filePath) {
        // Sanitize file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        filePath = fileName;
    }

    // Upload
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        upsert: true // Allow overwriting if path is explicit
      });

    if (error) {
      // Handle JWT expiration / "exp" claim error
      if (error.message?.includes('exp') || error.message?.includes('JWT') || error.message?.includes('invalid_grant')) {
        if (retryCount < 2) {
          console.warn("Supabase Upload: JWT error detected. Attempting session refresh and retry...", error.message);
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError) {
            return uploadFileToSupabase(file, path, retryCount + 1);
          }
        }
      }
      throw error;
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { 
      fileName: filePath, // Store path for deletion later if needed
      publicUrl: publicUrl 
    };

  } catch (error: any) {
    console.error('Supabase Upload Error:', error);
    
    // Check for "exp" claim error in caught error too
    if (error.message?.includes('exp') && retryCount < 2) {
       const { error: refreshError } = await supabase.auth.refreshSession();
       if (!refreshError) {
         return uploadFileToSupabase(file, path, retryCount + 1);
       }
    }

    // If bucket doesn't exist or RLS issue
    if (error.message && (error.message.includes('Bucket not found') || error.message.includes('The resource was not found'))) {
       throw new Error(`Bucket '${BUCKET_NAME}' not found. Please ensure a public bucket named '${BUCKET_NAME}' exists in your Supabase Storage.`);
    }
    throw new Error("Failed to upload to Supabase: " + error.message);
  }
};

/**
 * Deletes a file from Supabase Storage
 */
export const deleteFileFromSupabase = async (filePath: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Supabase Delete Error:', error);
  }
};

/**
 * Extracts the file path from a Supabase public URL
 */
export const extractPathFromSupabaseUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    // Standard Supabase public URL format:
    // https://[project-id].supabase.co/storage/v1/object/public/[bucket-name]/[file-path]
    const bucketPart = `/storage/v1/object/public/${encodeURIComponent(BUCKET_NAME)}/`;
    const decodedUrl = decodeURIComponent(url);
    const index = decodedUrl.indexOf(bucketPart.replace(/%20/g, ' '));
    
    if (index !== -1) {
      return decodedUrl.substring(index + bucketPart.replace(/%20/g, ' ').length);
    }
    
    // Fallback for different URL structures or if BUCKET_NAME is not encoded in URL
    const parts = url.split(`/public/`);
    if (parts.length > 1) {
      const pathWithBucket = parts[1];
      const bucketNameWithSlash = BUCKET_NAME + '/';
      if (pathWithBucket.startsWith(bucketNameWithSlash)) {
        return pathWithBucket.substring(bucketNameWithSlash.length);
      }
      // If bucket name is not at the start, try to find it
      const bucketIndex = pathWithBucket.indexOf('/');
      if (bucketIndex !== -1) {
        return pathWithBucket.substring(bucketIndex + 1);
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error extracting path from URL:', e);
    return null;
  }
};
