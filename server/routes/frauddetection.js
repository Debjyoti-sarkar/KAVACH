// server/routes/frauddetection.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/analyze", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const prompt = `
You are a fraud detection system for banking apps.
Analyze the following message and return:

1. scam: true/false  
2. scam_type: (OTP scam, UPI scam, bank scam, job scam, phishing, unknown)
3. risk_score: 0–100
4. explanation: brief reasoning

Message: "${message}"
Return JSON ONLY.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse the JSON from Gemini response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({ scam: false, scam_type: "unknown", risk_score: 0, explanation: text });
    }
  } catch (err) {
    console.error("Fraud detection error:", err);
    res.status(500).json({ error: "Fraud analysis failed", details: err.message });
  }
});

export default router;