/**
 * NexaSafe Analytics Server
 * Provides API endpoints and WebSocket for real-time behavioral analysis dashboard
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store current session data (in production, use a database)
let currentSessionData = {
  trustScore: 100,
  riskLevel: 'safe',
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

// Historical sessions
let sessionHistory = [];

// Behavior penalty descriptions
const BEHAVIOR_DESCRIPTIONS = {
  1: { name: 'Immediate Transaction', desc: 'Transaction immediately after login', severity: 'high' },
  2: { name: 'FD Broken', desc: 'Fixed Deposit broken', severity: 'high' },
  3: { name: 'Quick Loan Application', desc: 'Loan application after login', severity: 'high' },
  4: { name: 'Short Session', desc: 'Very short session duration', severity: 'medium' },
  5: { name: 'Multiple High-Risk', desc: 'Multiple high-risk actions', severity: 'high' },
  6: { name: 'Fast Tap', desc: 'Very fast tap detected', severity: 'low' },
  7: { name: 'Slow Tap', desc: 'Very slow tap detected', severity: 'low' },
  8: { name: 'Fast Swipe', desc: 'Excessive scrolling/fast swipe', severity: 'medium' },
  9: { name: 'Screen Revisits', desc: 'Repeated screen revisits', severity: 'low' },
  10: { name: 'OTP Skip', desc: 'OTP verification skipped', severity: 'low' },
  11: { name: 'Rapid Navigation', desc: 'Rapid screen transitions', severity: 'low' },
  12: { name: 'Failed PIN', desc: 'Multiple failed PIN attempts', severity: 'medium' },
  21: { name: 'PIN Failures', desc: 'Multiple failed PIN attempts', severity: 'medium' },
  22: { name: 'Inactive Taps', desc: 'Tapping in inactive areas', severity: 'low' },
  23: { name: 'Loan Browsing', desc: 'Multiple loans viewed without applying', severity: 'low' },
  33: { name: 'Sudden Transfer', desc: 'Sudden transfer after inactivity', severity: 'high' },
  34: { name: 'FD Withdrawal', desc: 'FD created and quickly withdrawn', severity: 'high' },
  42: { name: 'Account Switching', desc: 'Multiple account switches', severity: 'medium' },
  43: { name: 'OTP Bypass', desc: 'OTP bypass attempt', severity: 'high' },
  44: { name: 'Auth Failures', desc: 'Multiple failed authentications', severity: 'high' },
  45: { name: 'Screen Recording', desc: 'Screen recording detected', severity: 'critical' },
  50: { name: 'Large Transaction', desc: 'Large transaction amount', severity: 'high' }
};

// Behavior penalties
const BEHAVIOR_PENALTIES = {
  1: -15, 2: -15, 3: -15, 4: -10, 5: -15, 6: -6, 7: -6, 8: -10, 9: -6, 10: -6,
  11: -6, 12: -6, 21: -10, 22: -4, 23: -6, 33: -15, 34: -15, 42: -10, 43: -15,
  44: -15, 45: -20, 50: -15
};

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Calculate risk level from trust score
function getRiskLevel(score) {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'caution';
  if (score >= 40) return 'warning';
  return 'danger';
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected to NexaSafe dashboard');

  // Send current state on connection
  ws.send(JSON.stringify({
    type: 'init',
    data: currentSessionData
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// API Endpoints

// Get current session data
app.get('/api/nexasafe/session', (req, res) => {
  res.json(currentSessionData);
});

// Get session history
app.get('/api/nexasafe/history', (req, res) => {
  res.json(sessionHistory);
});

// Start a new session
app.post('/api/nexasafe/session/start', (req, res) => {
  currentSessionData = {
    trustScore: 100,
    riskLevel: 'safe',
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

  broadcast({ type: 'session_start', data: currentSessionData });
  res.json({ success: true, message: 'Session started' });
});

// End session
app.post('/api/nexasafe/session/end', (req, res) => {
  if (currentSessionData.sessionActive) {
    currentSessionData.sessionActive = false;
    currentSessionData.sessionEnd = new Date().toISOString();

    // Archive session
    sessionHistory.unshift({
      ...currentSessionData,
      id: Date.now()
    });

    // Keep only last 50 sessions
    if (sessionHistory.length > 50) {
      sessionHistory = sessionHistory.slice(0, 50);
    }

    broadcast({ type: 'session_end', data: currentSessionData });
  }
  res.json({ success: true, message: 'Session ended' });
});

// Update trust score
app.post('/api/nexasafe/trust-score', (req, res) => {
  const { trustScore, behaviorId, extraData } = req.body;

  currentSessionData.trustScore = Math.max(0, Math.min(100, trustScore));
  currentSessionData.riskLevel = getRiskLevel(currentSessionData.trustScore);

  if (behaviorId) {
    const penalty = BEHAVIOR_PENALTIES[behaviorId] || 0;
    const behaviorInfo = BEHAVIOR_DESCRIPTIONS[behaviorId] || { name: 'Unknown', desc: 'Unknown behavior', severity: 'low' };

    const log = {
      id: behaviorId,
      timestamp: new Date().toISOString(),
      penalty,
      name: behaviorInfo.name,
      description: behaviorInfo.desc,
      severity: behaviorInfo.severity,
      extraData
    };

    currentSessionData.behaviorLogs.push(log);
    currentSessionData.appliedPenalties.push(behaviorId);
  }

  broadcast({
    type: 'trust_update',
    data: {
      trustScore: currentSessionData.trustScore,
      riskLevel: currentSessionData.riskLevel,
      behaviorLogs: currentSessionData.behaviorLogs,
      appliedPenalties: currentSessionData.appliedPenalties
    }
  });

  res.json({ success: true, trustScore: currentSessionData.trustScore });
});

// Record behavior
app.post('/api/nexasafe/behavior', (req, res) => {
  const { behaviorId, extraData } = req.body;
  const penalty = BEHAVIOR_PENALTIES[behaviorId] || 0;
  const behaviorInfo = BEHAVIOR_DESCRIPTIONS[behaviorId] || { name: 'Unknown', desc: 'Unknown behavior', severity: 'low' };

  currentSessionData.trustScore = Math.max(0, currentSessionData.trustScore + penalty);
  currentSessionData.riskLevel = getRiskLevel(currentSessionData.trustScore);

  const log = {
    id: behaviorId,
    timestamp: new Date().toISOString(),
    penalty,
    name: behaviorInfo.name,
    description: behaviorInfo.desc,
    severity: behaviorInfo.severity,
    extraData
  };

  currentSessionData.behaviorLogs.push(log);
  currentSessionData.appliedPenalties.push(behaviorId);

  broadcast({
    type: 'behavior_detected',
    data: {
      log,
      trustScore: currentSessionData.trustScore,
      riskLevel: currentSessionData.riskLevel
    }
  });

  res.json({ success: true, log });
});

// Record tap event
app.post('/api/nexasafe/tap', (req, res) => {
  const tapEvent = {
    ...req.body,
    timestamp: new Date().toISOString()
  };

  currentSessionData.tapEvents.push(tapEvent);
  broadcast({ type: 'tap_event', data: tapEvent });
  res.json({ success: true });
});

// Record swipe event
app.post('/api/nexasafe/swipe', (req, res) => {
  const swipeEvent = {
    ...req.body,
    timestamp: new Date().toISOString()
  };

  currentSessionData.swipeEvents.push(swipeEvent);
  broadcast({ type: 'swipe_event', data: swipeEvent });
  res.json({ success: true });
});

// Record screen visit
app.post('/api/nexasafe/screen', (req, res) => {
  const { screen, duration } = req.body;

  currentSessionData.screensVisited.push({
    screen,
    timestamp: new Date().toISOString(),
    duration
  });

  if (duration) {
    currentSessionData.screenDurations[screen] =
      (currentSessionData.screenDurations[screen] || 0) + duration;
  }

  broadcast({
    type: 'screen_visit',
    data: { screen, duration, screensVisited: currentSessionData.screensVisited }
  });
  res.json({ success: true });
});

// Update full session data (for syncing from mobile app)
app.post('/api/nexasafe/sync', (req, res) => {
  const data = req.body;

  currentSessionData = {
    ...currentSessionData,
    ...data,
    riskLevel: getRiskLevel(data.trustScore || currentSessionData.trustScore)
  };

  broadcast({ type: 'sync', data: currentSessionData });
  res.json({ success: true });
});

// Get behavior descriptions
app.get('/api/nexasafe/behaviors', (req, res) => {
  res.json(BEHAVIOR_DESCRIPTIONS);
});

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`NexaSafe Analytics Server running on http://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
});
