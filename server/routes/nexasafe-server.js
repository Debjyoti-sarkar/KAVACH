import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- State ---
let currentSessionData = {
  trustScore: 100,
  riskLevel: "safe",
  sessionActive: false,
  sessionStart: null,
  behaviorLogs: [],
  appliedPenalties: [],
  tapEvents: [],
  swipeEvents: [],
  screensVisited: [],
  screenDurations: {},
  deviceInfo: null,
  screenRecordingDetected: false,
  sessionInput: {
    withinBankTransferAmount: null,
    fdBroken: false,
    loanTaken: false
  }
};

let sessionHistory = [];

// --- Behavior Constants ---
const BEHAVIOR_DESCRIPTIONS = {};
const BEHAVIOR_PENALTIES = {};

// --- Router Endpoints (/api/nexasafe/*) ---

router.get("/session", (req, res) => {
  res.json(currentSessionData);
});

router.get("/history", (req, res) => {
  res.json(sessionHistory);
});

router.post("/session/start", (req, res) => {
  currentSessionData = {
    trustScore: 100,
    riskLevel: "safe",
    sessionActive: true,
    sessionStart: new Date().toISOString(),
    behaviorLogs: [],
    appliedPenalties: [],
    tapEvents: [],
    swipeEvents: [],
    screensVisited: [],
    screenDurations: {},
    deviceInfo: req.body.deviceInfo || null,
    screenRecordingDetected: false,
    sessionInput: {
      withinBankTransferAmount: null,
      fdBroken: false,
      loanTaken: false
    }
  };

  res.json({ success: true });
});

router.post("/behavior", (req, res) => {
  const { behaviorId, extraData } = req.body;

  const penalty = BEHAVIOR_PENALTIES[behaviorId] || 0;
  const info = BEHAVIOR_DESCRIPTIONS[behaviorId] || {};

  currentSessionData.trustScore = Math.max(0, currentSessionData.trustScore + penalty);
  currentSessionData.behaviorLogs.push({
    id: behaviorId,
    timestamp: new Date().toISOString(),
    penalty,
    name: info.name,
    description: info.desc,
    severity: info.severity,
    extraData
  });

  res.json({ success: true });
});

router.post("/trust-score", (req, res) => {
  currentSessionData.trustScore = req.body.trustScore ?? currentSessionData.trustScore;
  res.json({ success: true });
});

router.post("/tap", (req, res) => {
  currentSessionData.tapEvents.push({ ...req.body, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

router.post("/screen", (req, res) => {
  currentSessionData.screensVisited.push({
    screen: req.body.screen,
    timestamp: new Date().toISOString(),
    duration: req.body.duration
  });
  res.json({ success: true });
});

export default router;
