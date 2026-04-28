import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KE || process.env.GEMINI_API_KEY || '' });

export const generateAIReport = async (
    reportType: string,
    timeframe: string,
    data: any
): Promise<string> => {
    const prompt = `
        You are an expert School Administrator and Data Analyst.
        Generate a highly professional, easy-to-understand ${timeframe} ${reportType} report.
        
        DATA CONTEXT:
        ${JSON.stringify(data, null, 2)}
        
        CRITICAL INSTRUCTIONS:
        - The audience is the school principal/management. Keep it exceptionally clean, concise, and easy to read.
        - NO FLUFF. Do not include generic AI greetings or unnecessary filler text.
        - Use simple, straightforward language. Avoid overly complex jargon.
        - ALWAYS format the report beautifully using Markdown.
        - Provide insightful analysis, not just a repeat of the numbers.
        
        REQUIRED STRUCTURE:
        1. **📊 Executive Summary**: A 2-3 sentence overview of the current status.
        2. **📈 Key Highlights**: Bullet points of top successes and biggest concerns.
        3. **📋 Data Breakdown**: 
           - Use MARKDOWN TABLES to present metrics cleanly.
           - CRITICAL: Ensure every markdown table has proper spacing and NEW LINES between the header, separator (---), and each data row to render correctly. Do not collapse tables into a single line.
           - DO NOT use text-based charts (no ASCII bars or emojis representing graphs) as real charts are already provided in the UI.
        4. **💡 Actionable Recommendations**: 3-4 clear, direct steps the school should take right now.
    `;

    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 2000;

    const executeWithRetry = async (attempt: number = 0): Promise<any> => {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });
            return response;
        } catch (error: any) {
            const isQuotaError = error.message?.includes('429') || 
                                error.message?.includes('quota') || 
                                error.message?.includes('RESOURCE_EXHAUSTED');
            
            if (isQuotaError && attempt < MAX_RETRIES) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt);
                console.warn(`Gemini Quota Error: Retrying in ${delay}ms (Attempt ${attempt + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return executeWithRetry(attempt + 1);
            }
            throw error;
        }
    };

    try {
        const response = await executeWithRetry();
        return response.text || "Failed to generate report content.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate AI report. Please try again later.");
    }
};
