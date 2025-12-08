// server/index.js - CLEANED, WORKING VERSION WITH GEMINI STT + BEHAVIOR ANALYSIS
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import path from "path";
import multer from "multer";
import express from "express";
import cors from "cors";
import fs from "fs";
import { writeFile, unlink } from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import paymentRouter from "./routes/payment.js";
import fraudDetectionRouter from "./routes/frauddetection.js";
import smsFraudRouter from "./routes/smsfraud.js";
import aadhaarRouter from "./routes/aadhaar.js";
import ttsRouter from "./tts.js";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: join(__dirname, ".env") });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Connect to MongoDB (for behavior analysis)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/nexavault";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB for Behavior Analysis"))
  .catch(err => console.log("⚠️ MongoDB connection optional:", err.message));

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ---- TTS ROUTE ----
app.use("/tts", ttsRouter);

// ---- MULTER CONFIG ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ---- HEALTH CHECK ----
const startTime = Date.now();
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: (Date.now() - startTime) / 1000,
    timestamp: new Date().toISOString(),
  });
});

// ---- PAYMENT ROUTES ----
app.use("/api/payment", paymentRouter);

<<<<<<< HEAD
// ---- FRAUD DETECTION / BEHAVIOR ANALYSIS ROUTES ----
app.use("/api/fraud", fraudDetectionRouter);

// ---- SMS FRAUD DETECTION ROUTES ----
app.use("/api/sms", smsFraudRouter);

// ---- AADHAAR / DIGILOCKER VERIFICATION ROUTES ----
app.use("/api/aadhaar", aadhaarRouter);
=======
// ---- FRAUD DETECTION / BEHAVIOR ANALYSIS ROUTES ----
app.use("/api/fraud", fraudDetectionRouter);

// ---- SMS FRAUD DETECTION ROUTES ----
app.use("/api/sms", smsFraudRouter);

// ---- AADHAAR / DIGILOCKER VERIFICATION ROUTES ----
app.use("/api/aadhaar", aadhaarRouter);
>>>>>>> 218b622 (Added Aadhaar KYC, OTP security, behavior & fraud analysis)

// ============================================================
// 🔥 REAL STT USING GOOGLE GEMINI + FFMPEG CONVERSION
// ============================================================

app.post("/assistant/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio provided" });

    console.log("🎤 Received audio:", req.file.originalname);

    // STEP 1: Save incoming m4a file
    const inputPath = path.join(__dirname, `rec-${Date.now()}.m4a`);
    const wavPath = path.join(__dirname, `rec-${Date.now()}.wav`);

    await writeFile(inputPath, req.file.buffer);

    // STEP 2: Convert .m4a → .wav
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

    // STEP 3: Read WAV → Base64
    const wavBuffer = fs.readFileSync(wavPath);
    const wavBase64 = wavBuffer.toString("base64");

    // STEP 4: Send WAV to Gemini
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
    console.log("🔍 Gemini Raw Response:", result);
    console.log("📝 Gemini Transcript:", text || "<EMPTY>");

    if (!text) {
      console.log("❗ WARNING: Gemini returned EMPTY text!");
      console.log("📦 WAV Buffer Size:", wavBuffer.length);
      console.log("📦 Base64 Length:", wavBase64.length);
    }

    // Cleanup temp files
    await unlink(inputPath).catch(() => {});
    await unlink(wavPath).catch(() => {});

    return res.json({ text });

  } catch (err) {
    console.error("❌ STT error:", err);
    return res.status(500).json({ error: "Transcription error", details: err.message });
  }
});

// ============================================================
// 🔥 RULE-BASED NLU PARSER (FULLY WORKING)
// ============================================================

app.post("/assistant/parse", (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required" });
  }

  const lowerText = text.toLowerCase();
  let intent = "unknown";
  let entities = {};
  let replyText = "I'm sorry, I didn't understand that.";
  let actionSuggested = "none";
  let confidence = 0.5;

  if (
    lowerText.includes("send") ||
    lowerText.includes("pay") ||
    lowerText.includes("transfer") ||
    (lowerText.includes("rupees") || lowerText.includes("rs")) && lowerText.match(/\d+/)
  ) {
    intent = "send_money";
    actionSuggested = "prefill_and_navigate_upi";
    confidence = 0.85;

    const amountMatch = lowerText.match(/(\d+(?:\.\d{2})?)/);
    if (amountMatch) entities.amount = amountMatch[1];

    const toMatch = lowerText.match(/to\s+(\w+)/i);
    if (toMatch) entities.recipient = toMatch[1];

    replyText = `I'll help you send ₹${entities.amount || ""} ${entities.recipient ? "to " + entities.recipient : ""}.`;
  }
  else if (lowerText.includes("balance")) {
    intent = "check_balance";
    replyText = "Let me show your balance.";
    actionSuggested = "ask_pin_for_balance";
  }
  else if (lowerText.includes("history")) {
    intent = "view_history";
    replyText = "Showing your transaction history.";
    actionSuggested = "show_history";
  }
  else if (lowerText.includes("qr")) {
    intent = "scan_qr";
    replyText = "Opening the QR scanner.";
    actionSuggested = "scan_qr";
  }
  else if (lowerText.includes("fraud")) {
    intent = "check_fraud";
    replyText = "Checking for fraud.";
    actionSuggested = "check_fraud";
  }
  else if (lowerText.includes("help") || lowerText.includes("settings")) {
    intent = "help";
    replyText = "Opening help and settings.";
    actionSuggested = "help_support_page";
  }
  else if (lowerText.includes("hello") || lowerText.includes("hi")) {
    intent = "greeting";
    replyText = "Hello! How can I help you today?";
  }

  res.json({ intent, entities, confidence, replyText, actionSuggested });
});

// ---- DEBUG ROUTES ----
app.get("/ping", (req, res) => res.json({ ok: true }));

app.get("/debug/config", (req, res) => {
  res.json({
    port: process.env.PORT || 3001,
  });
});

// ---- START SERVER ----
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`🎤 Transcribe: POST /assistant/transcribe`);
  console.log(`🧠 Parse: POST /assistant/parse`);
  console.log(`🔒 Fraud Detection: /api/fraud/*`);
  console.log(`   - POST /api/fraud/analyze-transaction`);
  console.log(`   - POST /api/fraud/track-event`);
  console.log(`   - POST /api/fraud/check-reauth`);
  console.log(`📱 SMS Fraud Detection: /api/sms/*`);
  console.log(`   - POST /api/sms/analyze`);
  console.log(`   - GET /api/sms/alerts/:userId`);
  console.log(`🆔 Aadhaar Verification: /api/aadhaar/*`);
  console.log(`   - POST /api/aadhaar/digilocker/auth-url`);
  console.log(`   - POST /api/aadhaar/digilocker/token`);
  console.log(`   - POST /api/aadhaar/digilocker/fetch`);
  console.log(`   - POST /api/aadhaar/request-otp`);
  console.log(`   - POST /api/aadhaar/verify-otp`);
  console.log(`   - GET /api/aadhaar/status/:userId`);
});
