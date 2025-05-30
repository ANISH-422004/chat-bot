const  { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async function thinkProcessGemeni(content) {
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "think how to solve this problem: " + content
    });
    return response.text
}

