import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function listModels() {
  if (!API_KEY) {
    console.error("API Key not found");
    return;
  }
  const genAI = new GoogleGenerativeAI(API_KEY);
  try {
    // There isn't a direct listModels in the standard SDK easily accessible this way usually, 
    // but we can try to probe a few.
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-1.5-flash-latest"];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent("test");
        console.log(`Model ${m} is available and working.`);
      } catch (e) {
        console.warn(`Model ${m} failed: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("Error probing models:", error);
  }
}

listModels();
