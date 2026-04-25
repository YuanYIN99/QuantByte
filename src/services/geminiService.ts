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
  },
  async getQuizFeedback(lessonBatch: string, question: string, userAnswer: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a helpful Quantitative Finance Professor. 
        The student has just completed a batch of lessons covering: "${lessonBatch}".
        
        The quiz question was: "${question}"
        The student's answer was: "${userAnswer}"
        
        Please grade the answer (tell them if they are right, partially right, or wrong) and provide a detailed explanation of the correct concept. Be encouraging and helpful.`,
      });
      
      return response.text;
    } catch (error) {
      console.error("Gemini Quiz Error:", error);
      throw new Error("I'm having trouble grading your answer. Let's just say you did great and keep going!");
    }
  }
};
