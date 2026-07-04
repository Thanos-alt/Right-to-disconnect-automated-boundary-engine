// Express server for the RTD-ABE demo server
const express = require('express');
const { authMiddleware } = require('./auth');
const { seedEmployees, seedMessages, computeDashboard } = require('./types');
const { evaluateMessage, getManagerCompliance, getCountrySummary, COUNTRY_RULES } = require('./engine');

function createServer() {
  const app = express();
  app.use(express.json());

  // CORS for local dev
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-rtd-token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Health
  app.get('/api/system/health', (_req, res) => {
    res.json({
      status: 'UP',
      service: 'right-to-disconnect-automated-boundary-engine',
      timestamp: new Date().toISOString(),
    });
  });

  // Snapshot - full seed data
  app.get('/snapshot', authMiddleware, (_req, res) => {
    res.json({
      employees: seedEmployees,
      queuedMessages: seedMessages.filter((m) => m.deliverAt !== null),
    });
  });

  // Dashboard - computed stats
  app.get('/dashboard', authMiddleware, (_req, res) => {
    res.json(computeDashboard());
  });

  // Policy evaluate
  app.post('/api/policy/evaluate', authMiddleware, (req, res) => {
    const { sender, employeeId, timestamp } = req.body;
    const result = evaluateMessage({ sender, employeeId, timestamp: timestamp || new Date().toISOString() });
    res.json(result);
  });

  // Country summaries
  app.get('/api/compliance/countries', authMiddleware, (_req, res) => {
    res.json(getCountrySummary());
  });

  // Manager compliance
  app.get('/api/compliance/manager/:id', authMiddleware, (req, res) => {
    const result = getManagerCompliance(req.params.id);
    res.json(result);
  });

  // Country rules
  app.get('/api/policy/rules', authMiddleware, (_req, res) => {
    res.json(COUNTRY_RULES);
  });

  return app;
}

module.exports = { createServer };
