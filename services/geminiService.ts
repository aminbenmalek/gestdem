
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartItemSuggestions = async (supplierCategory: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Génère une liste de 5 articles typiques pour un bon de commande chez un fournisseur de type "${supplierCategory}". Réponds uniquement en format JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unitPrice: { type: Type.NUMBER },
              taxRate: { type: Type.NUMBER }
            },
            required: ["description", "quantity", "unitPrice", "taxRate"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return [];
  }
};

export const analyzeOrderRisk = async (orderData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse ce bon de commande pour détecter des anomalies ou des risques financiers: ${JSON.stringify(orderData)}. Donne tes conseils en français sous forme de paragraphe court.`,
    });
    return response.text;
  } catch (error) {
    return "Analyse indisponible pour le moment.";
  }
};
