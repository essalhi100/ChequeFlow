
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractCheckData = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image,
            },
          },
          {
            text: "Analysez cette image de chèque et extrayez les détails suivants au format JSON: check_number, bank_name, amount (numérique), entity_name (le nom de l'émetteur ou du bénéficiaire), issue_date (AAAA-MM-JJ), due_date (AAAA-MM-JJ), et notes (toute information supplémentaire ou mention manuscrite trouvée sur le chèque). Si une date est manquante, estimez-la ou laissez-la nulle. Veuillez traduire les noms de banques ou d'entités en français si nécessaire et assurer une réponse exclusivement en format JSON.",
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
            notes: { type: Type.STRING, description: "Observations ou notes extraites du chèque" }
          }
        },
      },
    });

    const resultText = response.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
};
