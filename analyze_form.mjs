import fetch from 'node-fetch';
import { GoogleGenAI } from "@google/genai";

async function analyzeImage() {
  const imageUrl = 'https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/logs/Blue%20and%20White%20Modern%20School%20Registration%20Form%20A4.svg';
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KE || process.env.GEMINI_API_KEY });
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: "Analyze this school registration form. Extract all the field labels and their logical sections. For each field, provide its label and what type of data it expects (text, date, gender, etc.). Return the result as a JSON array of objects with 'label', 'section', and 'type'."
      },
      {
        inlineData: {
          mimeType: "image/svg+xml",
          data: base64
        }
      }
    ]
  });

  console.log(result.text);
}

analyzeImage();
