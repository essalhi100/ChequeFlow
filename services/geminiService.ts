
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
            text: "Analysez cette image de chèque et extrayez les détails suivants au format JSON: check_number, bank_name, amount (numérique), amount_in_words (le montant écrit en toutes lettres sur le chèque), entity_name (le nom de l'émetteur ou du bénéficiaire principal), issue_date (AAAA-MM-JJ), due_date (AAAA-MM-JJ), fund_name (le texte mentionné après 'A L'ORDRE DE' ou 'Bénéficiaire'), et notes (toute information supplémentaire). Veuillez assurer une réponse exclusivement au format JSON.",
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
            amount_in_words: { type: Type.STRING, description: "Le montant écrit en lettres sur le chèque" },
            entity_name: { type: Type.STRING },
            issue_date: { type: Type.STRING },
            due_date: { type: Type.STRING },
            fund_name: { type: Type.STRING, description: "Le nom figurant dans le champ 'A L'ORDRE DE' sur le chèque" },
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
