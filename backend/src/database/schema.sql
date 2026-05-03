-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS & ROLES
-- ─────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'analyst', 'viewer');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          user_role NOT NULL DEFAULT 'viewer',
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- STORE DB — customers, products, orders
-- ─────────────────────────────────────────
CREATE TABLE customers (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) UNIQUE NOT NULL,
    city       VARCHAR(100),
    state      VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(150) NOT NULL,
    category   VARCHAR(100),
    price      NUMERIC(10, 2) NOT NULL,
    stock      INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    status      VARCHAR(50) DEFAULT 'pending',
    total       NUMERIC(10, 2),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity   INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
);

-- ─────────────────────────────────────────
-- ANALYTICS DB — sales, traffic
-- ─────────────────────────────────────────
CREATE TABLE monthly_sales (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region      VARCHAR(100) NOT NULL,
    month       DATE NOT NULL,
    revenue     NUMERIC(12, 2),
    orders_count INTEGER
);

CREATE TABLE website_traffic (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date             DATE NOT NULL,
    visitors         INTEGER,
    conversions      INTEGER,
    conversion_rate  NUMERIC(5, 2)
);

-- ─────────────────────────────────────────
-- ADMIN DB — employees, financials, refunds
-- ─────────────────────────────────────────
CREATE TABLE employees (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    salary     NUMERIC(10, 2),
    joined_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refund_requests (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
    reason     TEXT,
    status     VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profit_loss (
    id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month    DATE NOT NULL,
    revenue  NUMERIC(12, 2),
    expenses NUMERIC(12, 2),
    profit   NUMERIC(12, 2)
);

-- ─────────────────────────────────────────
-- SAVED QUERIES
-- ─────────────────────────────────────────
CREATE TABLE saved_queries (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(150),
    query_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role   user_role,
    query_text  TEXT,
    source      VARCHAR(100),
    row_count   INTEGER,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SCHEDULED JOBS
-- ─────────────────────────────────────────
CREATE TABLE scheduled_jobs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    name         VARCHAR(150),
    query_json   JSONB NOT NULL,
    cron_expr    VARCHAR(100) NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    last_run_at  TIMESTAMP,
    created_at   TIMESTAMP DEFAULT NOW()
);