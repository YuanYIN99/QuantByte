import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export const geminiService = {
  async askAboutLesson(lessonTitle: string, lessonConcept: string, question: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a helpful Quantitative Finance Professor. 
        The current lesson is titled "${lessonTitle}". 
        The concept being explained is: "${lessonConcept}".
        
        A student is asking a question about this concept: "${question}"
        
        Please provide a clear, concise, and helpful explanation. Use simple terms and relate it back to the current lesson when possible.`,
      });
      
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.");
    }
  }
};
