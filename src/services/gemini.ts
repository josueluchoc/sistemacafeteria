import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export const generateProductDescription = async (productName: string) => {
  // 1. SIMULACIÓN (Fallback): Mensajes predefinidos por si falla la IA o no hay Key
  const fallbackDescription = () => {
    const adjectives = ["delicioso", "jugoso", "casero", "crujiente", "recién horneado", "tradicional"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `Exquisito ${productName} ${adj}, preparado con ingredientes frescos y el toque secreto de la parroquia.`;
  };

  try {
    // Si no hay API Key configurada, usamos el fallback silenciosamente
    if (!API_KEY) {
      console.warn("Falta VITE_GEMINI_API_KEY, usando modo simulación.");
      await new Promise(r => setTimeout(r, 1000)); // Simular espera de red
      return fallbackDescription();
    }

    // 2. INTENTO REAL CON GEMINI
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Prompt optimizado para menús
    const prompt = `Escribe una descripción apetitosa, corta y vendedora (máximo 15 palabras) para un producto de cafetería llamado "${productName}". No uses comillas.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;

  } catch (error) {
    console.error("Error conectando con Gemini AI:", error);
    // Si la IA falla (ej. cuota excedida), no rompemos la app, devolvemos el fallback
    return fallbackDescription();
  }
};