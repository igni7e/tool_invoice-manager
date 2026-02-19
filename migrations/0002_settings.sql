-- app_settings テーブル（単一行 upsert）
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  company_name TEXT,
  company_address TEXT,
  company_address_en TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  account_type TEXT DEFAULT '普通',
  account_number TEXT,
  account_holder TEXT,
  account_holder_en TEXT,
  tax_registration_number TEXT
);

-- invoice_items に unit カラム追加
ALTER TABLE invoice_items ADD COLUMN unit TEXT;
