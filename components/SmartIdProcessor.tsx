import React, { useState, useEffect } from 'react';
import { CircleNotch, MagicWand } from 'phosphor-react';
import { GoogleGenAI } from '@google/genai';

interface SmartIdProcessorProps {
  originalImage: string;
  uniformUrl?: string;
  backgroundColor?: string;
  onComplete: (processedImage: string) => void;
  onError: (error: string) => void;
}

const SmartIdProcessor: React.FC<SmartIdProcessorProps> = ({
  originalImage,
  uniformUrl,
  backgroundColor = '#0000FF',
  onComplete,
  onError
}) => {
  const [status, setStatus] = useState<string>('Initializing AI...');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const processImage = async () => {
      try {
        setStatus('Preparing image...');
        setProgress(10);

        // Extract base64 data and mime type
        const matches = originalImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          throw new Error('Invalid image format');
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        setStatus('Connecting to Gemini AI...');
        setProgress(30);

        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
          throw new Error('Gemini API key is missing');
        }

        const ai = new GoogleGenAI({ apiKey });

        setStatus('AI is processing the photo (removing background, enhancing)...');
        setProgress(60);

        const prompt = `Edit this photo to be a professional student ID card passport-size photo.

CRITICAL INSTRUCTIONS:
1. BACKGROUND: Remove the original background completely and replace it with a solid ${backgroundColor} color.
2. POSTURE & FRAMING: Make the person stand perfectly straight, facing forward, centered, just like a professional studio passport photo. Crop to a standard passport photo aspect ratio.
3. COMPLEXION & LIGHTING: Make the face glow, appear bright, fair, and well-lit. Enhance the skin tone to be bright and clear.
4. QUALITY & FIDELITY: Upgrade the uploaded image into a pristine, ultra-high-definition cinematic version while preserving the subject with absolute fidelity. The person's identity, facial anatomy, and expression must remain completely unchanged. Do not modify, reinterpret, or replace the core identity. Reconstruct and refine micro-level details including precise facial contours, authentic skin texture with naturally visible pores, individually defined hair strands, sharp and lifelike eyes, and clean, well-resolved edges throughout the image. Enhance dynamic range, contrast, and dimensional depth using balanced, studio-quality cinematic lighting.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        });

        setStatus('Finalizing image...');
        setProgress(90);

        let processedImageUrl = null;

        if (response.candidates && response.candidates.length > 0) {
          const parts = response.candidates[0].content.parts;
          for (const part of parts) {
            if (part.inlineData) {
              processedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (processedImageUrl) {
          setProgress(100);
          onComplete(processedImageUrl);
        } else {
          throw new Error('AI did not return a valid image.');
        }

      } catch (error: any) {
        console.error('Error processing image:', error);
        
        let errorMessage = error.message || 'Failed to process image with AI';
        
        // Check for quota/rate limit errors
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
          errorMessage = "AI Quota Exceeded! Please turn OFF the 'AI Processing' toggle at the top of the page to save photos normally, or try again later.";
        }
        
        onError(errorMessage);
      }
    };

    processImage();
  }, [originalImage, backgroundColor, onComplete, onError]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-[#1e3a8a] text-white p-4 rounded-full shadow-lg">
          <MagicWand size={48} weight="fill" className="animate-pulse" />
        </div>
      </div>
      
      <h2 className="text-xl font-black uppercase tracking-widest mb-2 text-center">
        AI Smart Processing
      </h2>
      
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 text-center h-8">
        {status}
      </p>
      
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden border border-slate-200 dark:border-slate-700">
        <div 
          className="bg-[#10b981] h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="text-xs font-black text-slate-400 text-right w-full">
        {progress}%
      </div>
    </div>
  );
};

export default SmartIdProcessor;
