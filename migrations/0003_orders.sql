-- v3: paid services — orders, payments and the admin e-mail queue.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,                 -- TG-XXXXXX
  token_hash TEXT NOT NULL,            -- sha256 of the customer's status token
  service TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'KGS', lang TEXT NOT NULL DEFAULT 'ky',
  name TEXT NOT NULL, email TEXT, contact TEXT NOT NULL,
  event_type TEXT NOT NULL, event_date TEXT, names TEXT NOT NULL, message TEXT, tpl TEXT, extra TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  note TEXT, result_url TEXT,
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  provider TEXT NOT NULL,              -- finik | manual
  provider_payment_id TEXT NOT NULL,   -- our PaymentId sent to the provider (one per attempt)
  provider_tx_id TEXT,                 -- provider transaction id from the verified webhook
  amount INTEGER NOT NULL, currency TEXT NOT NULL,
  status TEXT NOT NULL,                -- CREATED | ERROR | SUCCEEDED | FAILED | MISMATCH
  pay_url TEXT, error TEXT,
  created_at INTEGER NOT NULL, confirmed_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_ref ON payments(provider, provider_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_tx ON payments(provider, provider_tx_id) WHERE provider_tx_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TABLE IF NOT EXISTS email_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  kind TEXT NOT NULL,                  -- new_order | paid | payment_issue
  dedupe_key TEXT NOT NULL UNIQUE,     -- order:kind → never the same notification twice
  status TEXT NOT NULL,                -- PENDING | SENT | FAILED
  attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT,
  next_at INTEGER NOT NULL, created_at INTEGER NOT NULL, sent_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_email_due ON email_notifications(status, next_at);
CREATE INDEX IF NOT EXISTS idx_email_order ON email_notifications(order_id);
