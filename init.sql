-- ============================================================
--  init.sql  –  E-commerce API database schema
--
--  Run once to initialise the database:
--    psql -U postgres -d ecommerce -f init.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Index speeds up email look-ups and enforces uniqueness at DB level.
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
