'use strict';

/**
 * Integration tests for POST /users
 *
 * ✔  Uses a REAL PostgreSQL database – no mocking whatsoever.
 * ✔  Verifies API response shape and HTTP status codes.
 * ✔  Verifies the user row is actually written to the database.
 * ✔  Cleans up all test rows after every run.
 */

require('dotenv').config();
const request = require('supertest');
const app     = require('../src/app');
const pool    = require('../src/db');

// All test emails share this prefix – used for targeted cleanup.
const PREFIX = 'jest_';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a unique email address guaranteed not to collide across parallel runs. */
function uniqueEmail() {
  const ts  = Date.now();
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${PREFIX}${ts}_${rnd}@example.com`;
}

/** Removes every row whose email starts with the test prefix. */
async function cleanupTestUsers() {
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`${PREFIX}%`]);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Ensure the table exists so tests work against a brand-new database too.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL       PRIMARY KEY,
      name       VARCHAR(100) NOT NULL,
      email      VARCHAR(100) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `);
  // Remove any leftover data from a previously interrupted run.
  await cleanupTestUsers();
});

afterAll(async () => {
  await cleanupTestUsers();
  await pool.end();
});

// ── Test suite ────────────────────────────────────────────────────────────────

describe('POST /users', () => {

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('returns 201 with user id and correct shape', async () => {
    const payload = { name: 'John Doe', email: uniqueEmail(), password: '123456' };

    const res = await request(app).post('/users').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');
    expect(res.body.user).toBeDefined();
    expect(typeof res.body.user.id).toBe('number');
    expect(res.body.user.name).toBe(payload.name);
    expect(res.body.user.email).toBe(payload.email.toLowerCase());
    expect(res.body.user.created_at).toBeDefined();
  });

  it('actually inserts the user row into PostgreSQL', async () => {
    const payload = { name: 'Jane Smith', email: uniqueEmail(), password: 'securePass9' };

    const res = await request(app).post('/users').send(payload);
    expect(res.status).toBe(201);

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [res.body.user.id]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe(payload.name);
    expect(rows[0].email).toBe(payload.email.toLowerCase());
    // Password must be stored as a bcrypt hash, never plain text.
    expect(rows[0].password).not.toBe(payload.password);
    expect(rows[0].password).toMatch(/^\$2[ab]\$/);
  });

  it('does NOT expose the password hash in the API response', async () => {
    const payload = { name: 'Privacy Check', email: uniqueEmail(), password: 'hidden99' };

    const res = await request(app).post('/users').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.user.password).toBeUndefined();
  });

  // ── Duplicate email ──────────────────────────────────────────────────────────

  it('returns 409 when the same email is used twice', async () => {
    const payload = { name: 'Dup User', email: uniqueEmail(), password: 'abc123' };

    const first  = await request(app).post('/users').send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/users').send(payload);
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('Email already registered');
  });

  // ── Validation – missing fields ──────────────────────────────────────────────

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: uniqueEmail(), password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.missing).toContain('name is required');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'No Email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.missing).toContain('email is required');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'No Pass', email: uniqueEmail() });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.missing).toContain('password is required');
  });

  it('returns 400 with 3 missing errors when body is empty', async () => {
    const res = await request(app).post('/users').send({});

    expect(res.status).toBe(400);
    expect(res.body.missing.length).toBe(3);
  });

  // ── Validation – bad values ──────────────────────────────────────────────────

  it('returns 400 for an invalid email format', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Bad Email', email: 'not-an-email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid email format');
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Short Pass', email: uniqueEmail(), password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Password must be at least 6 characters');
  });
});
