-- Cloudflare D1 初期スキーマ
-- wrangler d1 execute invoice-manager --file=migrations/0001_initial.sql

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT,
  address TEXT,
  address_en TEXT,
  contact_name TEXT,
  contact_email TEXT,
  invoice_prefix TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  tax_rate REAL NOT NULL DEFAULT 0.1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'JPY',
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  notes_en TEXT,
  total_jpy INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  description_en TEXT,
  unit_cost REAL NOT NULL,
  qty REAL NOT NULL DEFAULT 1,
  tax_rate REAL NOT NULL DEFAULT 0.1,
  currency TEXT NOT NULL DEFAULT 'JPY',
  exchange_rate REAL DEFAULT 1,
  amount_jpy INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  rate REAL NOT NULL,
  rate_date TEXT NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_invoice_id ON exchange_rates(invoice_id);
