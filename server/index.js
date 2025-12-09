// -------------------------------
//  NEXAVAULT MASTER BACKEND
// -------------------------------

import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { writeFile, unlink } from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";

// ROUTERS
import paymentRouter from "./routes/payment.js";
import fraudDetectionRouter from "./routes/frauddetection.js";
import smsFraudRouter from "./routes/smsfraud.js";
import aadhaarRouter from "./routes/aadhaar.js";
import ttsRouter from "./tts.js";
import nexasafeRouter from "./routes/nexasafe-server.js"; // FIXED IMPORT

// --------------------------------------
// FFmpeg configuration
// --------------------------------------
ffmpeg.setFfmpegPath(ffmpegPath);

// --------------------------------------
// Resolve __dirname for ES modules
// --------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --------------------------------------
// Load .env file
// --------------------------------------
dotenv.config({ path: join(__dirname, ".env") });

// --------------------------------------
// Google Gemini AI initialization
// --------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --------------------------------------
// Connect MongoDB (optional for behavior)
// --------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nexavault";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB for Behavior Analysis"))
  .catch((err) =>
    console.log("⚠️ MongoDB optional, continuing without DB:", err.message)
  );

// --------------------------------------
// Express App Setup
// --------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// TTS
app.use("/tts", ttsRouter);

// FILE UPLOADS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// --------------------------------------
// HEALTH CHECK
// --------------------------------------
const startTime = Date.now();

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: (Date.now() - startTime) / 1000,
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------
// ROUTES
// --------------------------------------

// Payment
app.use("/api/payment", paymentRouter);

// Fraud detection
app.use("/api/fraud", fraudDetectionRouter);

// SMS Fraud
app.use("/api/sms", smsFraudRouter);

// Aadhaar / Digilocker
app.use("/api/aadhaar", aadhaarRouter);

// NexaSafe Router (FIXED)
app.use("/api/nexasafe", nexasafeRouter);

// --------------------------------------
// GOOGLE GEMINI SPEECH-TO-TEXT
// --------------------------------------
app.post("/assistant/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio provided" });

    console.log("🎤 Received audio:", req.file.originalname);

    // Save incoming file
    const inputPath = path.join(__dirname, `rec-${Date.now()}.m4a`);
    const wavPath = path.join(__dirname, `rec-${Date.now()}-conv.wav`);

    await writeFile(inputPath, req.file.buffer);

    // Convert m4a → wav
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(wavPath)
        .audioChannels(1)
        .audioFrequency(16000)
        .format("wav")
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    // Load wav → Base64
    const wavBuffer = fs.readFileSync(wavPath);
    const wavBase64 = wavBuffer.toString("base64");

    // Gemini STT
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: wavBase64,
                mimeType: "audio/wav",
              },
            },
            { text: "Transcribe this audio clearly." },
          ],
        },
      ],
    });

    const text = result?.response?.text() || "";
    console.log("📝 Transcript from Gemini:", text);

    await unlink(inputPath).catch(() => {});
    await unlink(wavPath).catch(() => {});

    res.json({ text });
  } catch (err) {
    console.error("❌ STT Error:", err);
    res.status(500).json({
      error: "Transcription failed",
      details: err.message,
    });
  }
});

// --------------------------------------
// RULE-BASED NLU PARSER
// --------------------------------------
app.post("/assistant/parse", (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required" });
  }

  const lower = text.toLowerCase();
  let intent = "unknown";
  let entities = {};
  let replyText = "I didn't understand that.";
  let actionSuggested = "none";

  // Simple intents
  if (lower.includes("send") || lower.includes("pay")) {
    intent = "send_money";
    actionSuggested = "prefill_and_navigate_upi";

    const amountMatch = lower.match(/\d+/);
    if (amountMatch) entities.amount = amountMatch[0];

    replyText = `Okay, sending ₹${entities.amount || ""}.`;
  }

  if (lower.includes("balance")) {
    intent = "check_balance";
    actionSuggested = "ask_pin_for_balance";
    replyText = "Let me fetch your balance.";
  }

  if (lower.includes("history")) {
    intent = "view_history";
    actionSuggested = "show_history";
    replyText = "Showing your transaction history.";
  }

  res.json({
    intent,
    entities,
    replyText,
    actionSuggested,
  });
});

// --------------------------------------
// START SERVER
// --------------------------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n============================================`);
  console.log(`✅ NexaVault Backend Running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🎤 STT: POST /assistant/transcribe`);
  console.log(`🧠 NLU: POST /assistant/parse`);
  console.log(`============================================\n`);
});
