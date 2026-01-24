
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Strictly follow initialization guideline: use a named parameter and direct environment variable access.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractCheckData = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Fix: Follow contents structure guideline: use an object with a parts array.
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "Analyze this check image and extract the following details in JSON format: check_number, bank_name, amount (numeric), entity_name (the person/company the check is from/to), issue_date (YYYY-MM-DD), and due_date (YYYY-MM-DD). If a date is missing, estimate or leave as null.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            check_number: { type: Type.STRING },
            bank_name: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            entity_name: { type: Type.STRING },
            issue_date: { type: Type.STRING },
            due_date: { type: Type.STRING },
          }
        },
      },
    });

    // Fix: Access response text as a property, as recommended.
    const resultText = response.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
};