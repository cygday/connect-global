import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function translateText(text: string, targetLanguage: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text, nothing else: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}
