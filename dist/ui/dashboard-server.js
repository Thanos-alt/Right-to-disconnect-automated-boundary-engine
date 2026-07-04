// UI Dashboard Server
// Serves additional dashboard-specific aggregations for the frontend

const express = require('express');
const { authMiddleware } = require('../auth');
const { seedEmployees, seedMessages, computeDashboard } = require('../types');
const { getCountrySummary, getManagerCompliance } = require('../engine');

function createDashboardRouter() {
  const router = express.Router();

  // All routes require auth
  router.use(authMiddleware);

  // Dashboard summary
  router.get('/summary', (_req, res) => {
    res.json(computeDashboard());
  });

  // Employee list
  router.get('/employees', (_req, res) => {
    res.json(seedEmployees);
  });

  // Queued messages
  router.get('/queue', (_req, res) => {
    res.json(seedMessages.filter((m) => m.deliverAt !== null));
  });

  // Delivered messages
  router.get('/delivered', (_req, res) => {
    res.json(seedMessages.filter((m) => m.deliverAt === null));
  });

  // All messages
  router.get('/messages', (_req, res) => {
    res.json(seedMessages);
  });

  // Country compliance breakdown
  router.get('/countries', (_req, res) => {
    res.json(getCountrySummary());
  });

  // Manager overview
  router.get('/managers', (_req, res) => {
    const managerIds = [...new Set(seedMessages.map((m) => m.sender))];
    res.json(managerIds.map((id) => getManagerCompliance(id)));
  });

  return router;
}

module.exports = { createDashboardRouter };
