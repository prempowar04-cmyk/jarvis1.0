import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * GeminiBrain
 * ─────────────────────────────────────────────────────────────
 * Powers PREMEX AI with dynamic intelligence.
 * Addresses user as "Boss" and provides short responses.
 */
export const getGeminiResponse = async (userVoiceInput) => {
  if (!API_KEY) return "Boss, I need the activation key to fully initialize my neural link.";

  // List of models to try in order of preference
  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];
  let lastError = null;

  for (const modelId of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      
      const prompt = `
        You are PREMEX AI, a sophisticated, powerful, and cinematic AI assistant.
        User Profile: You MUST always address the user as "Boss".
        Persona: Professional, slightly intimidating but loyal, futuristic JARVIS-style.
        Context: You are currently active in a futuristic secure access HUD.
        Task: Respond to the following user voice input.
        Constraint: Keep your response SHORT (max 2-3 sentences).

        TASK CAPABILITY:
        If the user asks to open an app, send a message, or browse a website, include ONE marker at the VERY END:
        - [[ACTION: OPEN_WHATSAPP, PHONE: "number", MESSAGE: "text"]]
        - [[ACTION: OPEN_APP, APP: "GMAIL|YOUTUBE|GITHUB|WHATSAPP"]]
        - [[ACTION: OPEN_URL, URL: "https://..."]]
        - [[ACTION: SEARCH, QUERY: "search term"]]
        - [[ACTION: FILE_HANDLER, TASK: "ANALYZE|SAVE"]]

        Gender Switching: 
        - [[SET_VOICE: FEMALE]]
        - [[SET_VOICE: MALE]]

        User Input: "${userVoiceInput}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn(`Model ${modelId} failed:`, error);
      lastError = error;
      continue; // Try next model
    }
  }

  // If all models fail
  const errMsg = lastError?.message || "All neural paths blocked.";
  return `Boss, there is critical interference in the neural link. Error: ${errMsg.substring(0, 50).toUpperCase()}`;
};
