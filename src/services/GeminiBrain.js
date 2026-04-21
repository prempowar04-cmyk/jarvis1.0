import { GoogleGenerativeAI } from "@google/generative-ai";

const getAPIKey = () => import.meta.env.VITE_GEMINI_API_KEY;

/**
 * GeminiBrain
 * ─────────────────────────────────────────────────────────────
 * Powers PREMEX AI with dynamic intelligence.
 * Addresses user as "Boss" and provides short responses.
 */
export const getGeminiResponse = async (userVoiceInput) => {
  const key = getAPIKey();
  if (!key) return "Boss, I need the activation key to fully initialize my neural link.";

  const genAI = new GoogleGenerativeAI(key);

  // List of models to try in order of preference
  const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"];
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
        If you need to execute an action based on the user's prompt, include exactly ONE marker at the VERY END of your response.
        - [[ACTION: SYSTEM_CMD, CMD: "close_apps"]] (Use to close all extraneous running applications)
        - [[ACTION: SET_ALARM, MINS: 10]] (Use to set an alarm for a specific number of minutes)
        - [[ACTION: OPEN_WHATSAPP, PHONE: "number", MESSAGE: "text"]]
        - [[ACTION: OPEN_APP, APP: "GMAIL|YOUTUBE|GITHUB|WHATSAPP"]]
        - [[ACTION: OPEN_URL, URL: "https://..."]]
        - [[ACTION: SEARCH, QUERY: "search term"]]

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
