// server/index.js - SIMPLIFIED VERSION
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the server directory
dotenv.config({ path: join(__dirname, '.env') });

import express from "express";
import cors from "cors";
import paymentRouter from "./routes/payment.js";
import ttsRouter from "./tts.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ---------- TTS ROUTE ----------
app.use("/tts", ttsRouter);

// Configure multer for audio file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ---------- HEALTH CHECK ----------
const startTime = Date.now();
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - startTime) / 1000
  });
});

// ---------- PAYMENT ROUTES ----------
app.use("/api/payment", paymentRouter);

// ---------- VOICE ASSISTANT ROUTES ----------

// Transcribe audio to text (Speech-to-Text)
app.post("/assistant/transcribe", upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    console.log("Received audio file:", req.file.originalname, req.file.size, "bytes");

    // TODO: Integrate with actual STT service (Google Cloud Speech, Whisper, etc.)
    // For now, return a placeholder response
    // You can replace this with actual STT API calls
    
    // Example integration with OpenAI Whisper API:
    // const formData = new FormData();
    // formData.append('file', req.file.buffer, req.file.originalname);
    // formData.append('model', 'whisper-1');
    // const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
    //   body: formData
    // });
    // const result = await response.json();
    // return res.json({ text: result.text });

    // Placeholder response - replace with actual STT integration
    res.json({ 
      text: "Audio received. Please configure STT service.",
      debug: {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Transcription failed", details: error.message });
  }
});

// Parse text for intent and entities (NLU)
app.post("/assistant/parse", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    console.log("Parsing text:", text);

    // Simple rule-based NLU - replace with actual NLU service
    const lowerText = text.toLowerCase();
    let intent = "unknown";
    let entities = {};
    let replyText = "I'm sorry, I didn't understand that. Can you please rephrase?";
    let actionSuggested = "none";
    let confidence = 0.5;

    // Intent detection rules
    if (lowerText.includes("send") || lowerText.includes("pay") || lowerText.includes("transfer") || 
        (lowerText.includes("rupees") || lowerText.includes("rs")) && lowerText.match(/\d+/)) {
      intent = "send_money";
      replyText = "I'll help you send money. Opening the payment screen.";
      actionSuggested = "prefill_and_navigate_upi";
      confidence = 0.85;

      // Extract amount if mentioned
      const amountMatch = lowerText.match(/(\d+(?:\.\d{2})?)\s*(?:rupees?|rs\.?|₹)?/i);
      if (amountMatch) {
        entities.amount = amountMatch[1];
        replyText = `I'll help you send ₹${amountMatch[1]}. Opening the payment screen.`;
      }

      // Extract recipient if mentioned
      const toMatch = lowerText.match(/to\s+(\w+)/i);
      if (toMatch) {
        entities.recipient = toMatch[1];
        replyText = `I'll help you send money to ${toMatch[1]}. Opening the payment screen.`;
      }
    } 
    else if (lowerText.includes("balance") || lowerText.includes("how much") || lowerText.includes("account")) {
      intent = "check_balance";
      replyText = "Let me show you your account balance. Please enter your PIN.";
      actionSuggested = "ask_pin_for_balance";
      confidence = 0.9;
    }
    else if (lowerText.includes("history") || lowerText.includes("transaction") || lowerText.includes("recent")) {
      intent = "view_history";
      replyText = "Here are your recent transactions.";
      actionSuggested = "show_history";
      confidence = 0.85;
    }
    else if (lowerText.includes("scan") && lowerText.includes("qr")) {
      intent = "scan_qr";
      replyText = "Opening the QR scanner for you.";
      actionSuggested = "scan_qr";
      confidence = 0.9;
    }
    else if (lowerText.includes("fraud") || lowerText.includes("scam") || lowerText.includes("suspicious")) {
      intent = "check_fraud";
      replyText = "Let me check this for potential fraud.";
      actionSuggested = "check_fraud";
      confidence = 0.85;
    }
    else if (lowerText.includes("help") || lowerText.includes("support") || lowerText.includes("settings")) {
      intent = "help";
      replyText = "Opening the help and settings page.";
      actionSuggested = "help_support_page";
      confidence = 0.8;
    }
    else if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
      intent = "greeting";
      replyText = "Hello! How can I help you today? You can ask me to send money, check balance, view transactions, or scan a QR code.";
      actionSuggested = "none";
      confidence = 0.95;
    }

    res.json({
      intent,
      entities,
      confidence,
      replyText,
      actionSuggested
    });
  } catch (error) {
    console.error("Parse error:", error);
    res.status(500).json({ error: "Parse failed", details: error.message });
  }
});

// ---------- TEST ----------
app.get("/ping", (req, res) => res.json({ ok: true }));

// Debug endpoint to verify env vars are loaded
app.get("/debug/config", (req, res) => {
  res.json({
    cashfreeEnv: process.env.CASHFREE_ENV || 'not set',
    appId: process.env.CASHFREE_APP_ID ? `${process.env.CASHFREE_APP_ID.substring(0, 10)}...` : 'not set',
    secretKey: process.env.CASHFREE_SECRET_KEY ? 'configured ✅' : 'not set ❌',
    port: process.env.PORT || 3001
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server listening on ${PORT} (accessible from network)`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎤 Transcribe: http://localhost:${PORT}/assistant/transcribe`);
  console.log(`🧠 Parse: http://localhost:${PORT}/assistant/parse`);
});
