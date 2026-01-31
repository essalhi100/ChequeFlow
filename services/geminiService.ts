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
            text: "Analysez cette image de chèque et extrayez les détails suivants au format JSON: check_number, bank_name, amount (numérique uniquement, ex: 1500.50), entity_name (émetteur ou bénéficiaire), issue_date (AAAA-MM-JJ), due_date (AAAA-MM-JJ), fund_name (le texte mentionné après 'A L'ORDRE DE'), et notes. N'extrayez PAS le montant en toutes lettres. Réponse exclusivement en JSON.",
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
            fund_name: { type: Type.STRING, description: "Le nom figurant dans le champ 'A L'ORDRE DE' sur le chèque" },
            notes: { type: Type.STRING, description: "Observations extraites" }
          },
          required: ["check_number", "amount", "entity_name"]
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