import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from './rounding';

const currencyEnum = z.enum(SUPPORTED_CURRENCIES);
const taxRateEnum = z.union([z.literal(0), z.literal(0.08), z.literal(0.1)]);

// ──────────────────────────────
// Client スキーマ
// ──────────────────────────────
export const createClientSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(200),
  nameEn: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  addressEn: z.string().max(500).optional(),
  contactName: z.string().max(200).optional(),
  contactEmail: z.string().email('メールアドレスの形式が正しくありません').optional().or(z.literal('')),
  invoicePrefix: z.string().min(1, 'プレフィックスは必須です').max(50),
  currency: currencyEnum.default('JPY'),
  taxRate: taxRateEnum.default(0.1),
});

export const updateClientSchema = createClientSchema.partial();

// ──────────────────────────────
// InvoiceItem スキーマ
// ──────────────────────────────
const invoiceItemSchema = z.object({
  description: z.string().min(1, '品名は必須です').max(500),
  descriptionEn: z.string().max(500).optional(),
  unitCost: z.number().nonnegative('単価は0以上にしてください'),
  qty: z.number().positive('数量は0より大きくしてください'),
  unit: z.string().max(20).optional(),
  taxRate: taxRateEnum.default(0.1),
  currency: currencyEnum.default('JPY'),
  exchangeRate: z.number().positive('為替レートは0より大きくしてください').default(1),
  sortOrder: z.number().int().nonnegative().optional(),
});

// ──────────────────────────────
// Invoice スキーマ
// ──────────────────────────────
const statusEnum = z.enum(['draft', 'sent', 'paid']);

export const createInvoiceSchema = z.object({
  clientId: z.number().int().positive('クライアントを選択してください'),
  invoiceNumber: z.string().min(1, '請求書番号は必須です').max(100),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式は YYYY-MM-DD にしてください'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式は YYYY-MM-DD にしてください'),
  currency: currencyEnum.default('JPY'),
  status: statusEnum.optional().default('draft'),
  notes: z.string().max(2000).optional(),
  notesEn: z.string().max(2000).optional(),
  bankAccountId: z.number().int().positive().nullable().optional(),
  items: z.array(invoiceItemSchema).min(1, '明細を1行以上追加してください'),
  exchangeRates: z.array(z.object({
    currency: currencyEnum,
    rate: z.number().positive(),
    rateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.omit({ items: true }).partial().extend({
  items: z.array(invoiceItemSchema).min(1).optional(),
  status: statusEnum.optional(),
});

// ──────────────────────────────
// Settings スキーマ
// ──────────────────────────────
export const settingsSchema = z.object({
  companyName: z.string().max(200).optional(),
  companyAddress: z.string().max(500).optional(),
  companyAddressEn: z.string().max(500).optional(),
  bankName: z.string().max(200).optional(),
  bankBranch: z.string().max(200).optional(),
  accountType: z.string().max(10).optional(),
  accountNumber: z.string().max(50).optional(),
  accountHolder: z.string().max(200).optional(),
  accountHolderEn: z.string().max(200).optional(),
  taxRegistrationNumber: z.string().max(20).optional(),
  bankCode: z.string().max(10).optional(),
  swiftCode: z.string().max(20).optional(),
  bankNameEn: z.string().max(200).optional(),
  bankBranchEn: z.string().max(200).optional(),
});

// ──────────────────────────────
// BankAccount スキーマ
// ──────────────────────────────
export const createBankAccountSchema = z.object({
  label: z.string().min(1, 'ラベルは必須です').max(200),
  bankName: z.string().max(200).optional(),
  bankBranch: z.string().max(200).optional(),
  bankNameEn: z.string().max(200).optional(),
  bankBranchEn: z.string().max(200).optional(),
  accountType: z.string().max(10).optional(),
  accountNumber: z.string().max(50).optional(),
  accountHolder: z.string().max(200).optional(),
  accountHolderEn: z.string().max(200).optional(),
  bankCode: z.string().max(10).optional(),
  swiftCode: z.string().max(20).optional(),
  isDefault: z.number().int().min(0).max(1).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

// ──────────────────────────────
// バリデーションヘルパー
// ──────────────────────────────
export function parseBody<T>(schema: z.ZodType<T>, data: unknown): { data: T } | { error: Response } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return {
      error: Response.json(
        { error: 'バリデーションエラー', details: messages },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}
