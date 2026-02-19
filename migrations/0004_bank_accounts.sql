-- bank_accounts テーブル
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  bank_name TEXT,
  bank_branch TEXT,
  bank_name_en TEXT,
  bank_branch_en TEXT,
  account_type TEXT DEFAULT '普通',
  account_number TEXT,
  account_holder TEXT,
  account_holder_en TEXT,
  bank_code TEXT,
  swift_code TEXT,
  is_default INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- invoices テーブルに bank_account_id カラムを追加
ALTER TABLE invoices ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id);
