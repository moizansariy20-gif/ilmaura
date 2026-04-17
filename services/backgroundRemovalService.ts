import { removeBackground as removeBackgroundImgly } from '@imgly/background-removal';

/**
 * Resizes an image if it exceeds a maximum dimension
 */
const resizeImageIfNeeded = (base64: string, maxDim: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxDim && img.height <= maxDim) {
        resolve(base64);
        return;
      }

      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = base64;
  });
};

export const removeBackground = async (
  imageSrc: string, 
  backgroundColor: string = '#0000FF',
  onProgress?: (status: string, progress: number) => void
): Promise<string> => {
  console.log('EduControl: Starting background removal for', imageSrc.substring(0, 50) + '...');
  try {
    // 0. Pre-process: Resize image if it's too large to save memory/processing time
    // Passport photos don't need high res. 800px is more than enough.
    let processedSrc = imageSrc;
    try {
      processedSrc = await resizeImageIfNeeded(imageSrc, 800);
      console.log('EduControl: Image resized for processing');
    } catch (resizeErr) {
      console.warn('EduControl: Image resizing failed, using original', resizeErr);
    }

    // 1. Remove background using @imgly/background-removal
    console.log('EduControl: Calling @imgly/background-removal...');
    const blob = await removeBackgroundImgly(processedSrc, {
      model: 'isnet', 
      progress: (status, progress) => {
        // Handle byte counts in progress
        let normalizedProgress = progress;
        if (progress > 1) {
          normalizedProgress = Math.min(0.99, progress / 45000000);
        }
        
        console.log(`EduControl: Background removal progress - ${status}: ${Math.round(normalizedProgress * 100)}%`);
        if (onProgress) onProgress(status, normalizedProgress);
      },
      output: {
        format: 'image/png',
        quality: 0.8,
      }
    });
    console.log('EduControl: Background removal blob received', blob.size, 'bytes');

    // 2. Create a canvas to apply the blue background
    return new Promise((resolve, reject) => {
      console.log('EduControl: Creating canvas for blue background...');
      const img = new Image();
      
      // Set a timeout for image loading - Increased to 60s for model downloads
      const timeout = setTimeout(() => {
        console.error('EduControl: Image loading timed out');
        reject(new Error('Image processing timed out. This usually happens on slow internet while downloading AI models. Please try again.'));
      }, 60000);

      img.onload = () => {
        clearTimeout(timeout);
        console.log('EduControl: Image loaded, drawing to canvas...');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Fill blue background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the person (transparent background image) over the blue
        ctx.drawImage(img, 0, 0);

        console.log('EduControl: Canvas processing complete');
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => {
        clearTimeout(timeout);
        console.error('EduControl: Image loading error');
        reject(new Error('Failed to process transparent image'));
      };
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('EduControl: Background removal error:', error);
    throw new Error('Failed to remove background. Please try again with a clearer photo.');
  }
};
