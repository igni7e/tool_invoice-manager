import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// clients テーブル
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  address: text('address'),
  addressEn: text('address_en'),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  invoicePrefix: text('invoice_prefix').notNull(),  // 例: 'NLCS-', 'CWC-'
  currency: text('currency').notNull().default('JPY'),  // JPY/USD/EUR/GBP/AUD/CAD/SGD/NZD
  taxRate: real('tax_rate').notNull().default(0.1),  // 0.1 = 10%
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// invoices テーブル
export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => clients.id),
  invoiceNumber: text('invoice_number').notNull(),  // 例: 'NLCS-January 2026'
  invoiceDate: text('invoice_date').notNull(),  // YYYY-MM-DD
  dueDate: text('due_date').notNull(),
  currency: text('currency').notNull().default('JPY'),
  status: text('status').notNull().default('draft'),  // draft/sent/paid
  notes: text('notes'),
  notesEn: text('notes_en'),
  totalJpy: integer('total_jpy').notNull().default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// invoice_items テーブル
export const invoiceItems = sqliteTable('invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  descriptionEn: text('description_en'),
  unitCost: real('unit_cost').notNull(),
  qty: real('qty').notNull().default(1),
  taxRate: real('tax_rate').notNull().default(0.1),
  currency: text('currency').notNull().default('JPY'),
  exchangeRate: real('exchange_rate').default(1),  // 外貨の場合の為替レート
  amountJpy: integer('amount_jpy').notNull(),  // ROUNDDOWN(unitCost * qty * (1+taxRate), 0) をJPY換算
  sortOrder: integer('sort_order').notNull().default(0),
});

// exchange_rates テーブル
export const exchangeRates = sqliteTable('exchange_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  currency: text('currency').notNull(),
  rate: real('rate').notNull(),
  rateDate: text('rate_date').notNull(),
});
