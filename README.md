# E-commerce API

A production-quality Node.js REST API for user registration backed by PostgreSQL.

---

## Tech Stack

| Layer       | Library / Tool        |
|-------------|-----------------------|
| Runtime     | Node.js 18+           |
| Framework   | Express.js            |
| Database    | PostgreSQL 14+        |
| DB Driver   | pg (node-postgres)    |
| Passwords   | bcryptjs              |
| Testing     | Jest + Supertest      |
| CI          | GitHub Actions        |

---

## Project Structure

```
vscode/
├── src/
│   ├── app.js            # Express app (middleware + routes)
│   ├── server.js         # HTTP server entry point
│   ├── db.js             # PostgreSQL connection pool
│   └── routes/
│       └── users.js      # POST /users handler
├── tests/
│   └── users.test.js     # Real integration tests (10 cases)
├── .env.example          # Environment variable template
├── init.sql              # Database schema
└── package.json
```

---

## API Reference

### `POST /users` — Register a new user

**Request body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

**Success — `201 Created`**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error responses**

| Status | Reason                        |
|--------|-------------------------------|
| 400    | Missing or invalid fields     |
| 409    | Email already registered      |
| 500    | Internal server error         |

---

## Local Setup

### Step 1 – Install PostgreSQL

**Ubuntu / Debian**
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS (Homebrew)**
```bash
brew install postgresql@15 && brew services start postgresql@15
```

**Windows** – Download the installer from https://www.postgresql.org/download/windows/

---

### Step 2 – Create the database

```bash
# Linux / macOS
sudo -u postgres psql -c "CREATE DATABASE ecommerce;"

# Windows (psql in PATH)
psql -U postgres -c "CREATE DATABASE ecommerce;"
```

---

### Step 3 – Apply the schema

```bash
psql -U postgres -d ecommerce -f init.sql
```

---

### Step 4 – Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set your actual values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

---

### Step 5 – Install dependencies

```bash
npm install
```

---

### Step 6 – Start the server

```bash
npm start
```

API is now live at `http://localhost:3000`.

---

### Step 7 – Run tests

Tests use a **real PostgreSQL database** (no mocking).  
By default they connect using the same `.env` values.

```bash
npm test
```

Jest runs all cases sequentially (`--runInBand`) and automatically deletes test rows after every run.

---

## Push to GitHub

```bash
# From the repo root (one level above vscode/)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

GitHub Actions will automatically run the full test suite on every push.
