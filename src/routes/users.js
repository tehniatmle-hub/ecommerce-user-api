'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const pool     = require('../db');

const router = express.Router();

/**
 * POST /users
 * Register a new user.
 *
 * Body   : { name, email, password }
 * Returns: 201 { message, user: { id, name, email, created_at } }
 */
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  // ── Field presence validation ──────────────────────────────────────────────
  const missing = ['name', 'email', 'password'].filter(
    (field) => !req.body[field] || String(req.body[field]).trim() === ''
  );
  if (missing.length > 0) {
    return res.status(400).json({
      error:   'Validation failed',
      missing: missing.map((f) => `${f} is required`),
    });
  }

  // ── Email format validation ────────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // ── Password length validation ─────────────────────────────────────────────
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // ── Hash password (never store plain text) ─────────────────────────────
    const passwordHash = await bcrypt.hash(String(password), 10);

    // ── Insert into PostgreSQL ─────────────────────────────────────────────
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [
        String(name).trim(),
        String(email).toLowerCase().trim(),
        passwordHash,
      ]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    // PostgreSQL unique-violation error code
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('POST /users error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
