import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyD5oDWPX2HUVSlX3hSZnFGFMbx9TX7o5EE";
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest"];
  for (const modelId of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const prompt = "Hello";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      console.log(`Success with ${modelId}:`, response.text());
      return;
    } catch (error) {
      console.warn(`Model ${modelId} failed:`, error.message);
    }
  }
  console.log("All models failed.");
}
test();
