'use strict';

const express    = require('express');
const usersRoute = require('./routes/users');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/users', usersRoute);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
