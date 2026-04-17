import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KE || process.env.GEMINI_API_KEY || '' });

export const generateAIReport = async (
    reportType: string,
    timeframe: string,
    data: any
): Promise<string> => {
    const prompt = `
        You are a professional School Administration Auditor. 
        Generate a comprehensive ${timeframe} ${reportType} report for a school based on the provided data.
        
        DATA CONTEXT:
        ${JSON.stringify(data, null, 2)}
        
        REPORT STRUCTURE:
        1. **Summary**: A high-level overview of the school's status during this period.
        2. **Key Metrics**: Analysis of core data points (Attendance, Financials, Enrollment).
        3. **Data Analysis**: 
           - Patterns in student and teacher attendance.
           - Financial summary (Revenue vs Expenses).
           - Operational status.
        4. **Observations**:
           - **Positive Findings**: What is working well.
           - **Areas for Improvement**: Identified gaps or issues.
           - **Risks**: Potential concerns.
        5. **Recommendations**: Actionable steps for the administration.
        6. **Conclusion**: Final summary of the reporting period.
        
        FORMATTING:
        - Use standard Markdown with clear headings.
        - Use tables for data presentation.
        - Maintain a formal, objective, and professional tone.
        - Avoid flowery or "AI-style" language. Use standard administrative terminology.
        - Language: English.
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
