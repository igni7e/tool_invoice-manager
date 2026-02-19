/**
 * 端数処理ユーティリティ
 *
 * 端数処理ルール:
 * - 各行の税込金額: Math.floor(unitCost * qty * (1 + taxRate))
 * - 外貨の場合: Math.floor(unitCostForeign * qty * (1 + taxRate) * exchangeRate)
 * - 消費税表示 = 合計 - 税抜合計の積み上げ
 * - 請求合計 = 行の積み上げ（追加丸めなし）
 *
 * 検証値: NLCSv2で ¥666,464（消費税¥60,588）が再現できること
 */

export interface LineItem {
  unitCost: number;
  qty: number;
  taxRate: number;
  currency: string;
  exchangeRate?: number;
}

/**
 * 行の税込金額をJPY換算で計算（切り捨て）
 */
export function calcAmountJpy(item: LineItem): number {
  const { unitCost, qty, taxRate, exchangeRate = 1 } = item;
  return Math.floor(unitCost * qty * (1 + taxRate) * exchangeRate);
}

/**
 * 行の税抜金額をJPY換算で計算（切り捨て）
 */
export function calcSubtotalJpy(item: LineItem): number {
  const { unitCost, qty, exchangeRate = 1 } = item;
  return Math.floor(unitCost * qty * exchangeRate);
}

/**
 * 行の配列から合計・消費税を計算
 * - totalJpy: 各行のamountJpyの積み上げ
 * - taxJpy: totalJpy - 各行の税抜金額の積み上げ
 */
export function calcTotals(items: LineItem[]): {
  totalJpy: number;
  subtotalJpy: number;
  taxJpy: number;
} {
  const totalJpy = items.reduce((sum, item) => sum + calcAmountJpy(item), 0);
  const subtotalJpy = items.reduce((sum, item) => sum + calcSubtotalJpy(item), 0);
  const taxJpy = totalJpy - subtotalJpy;

  return { totalJpy, subtotalJpy, taxJpy };
}

/**
 * 通貨フォーマット
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}

export const SUPPORTED_CURRENCIES = [
  'JPY', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'NZD',
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * 支払期限計算: 請求日の翌月末
 * 例: 2026-01-15 → 2026-02-28
 */
export function calcDueDate(invoiceDate: string): string {
  const date = new Date(invoiceDate);
  const dueDate = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  return dueDate.toISOString().split('T')[0];
}

/**
 * 請求書番号自動採番
 * 例: prefix='NLCS-', date='2026-01-15' → 'NLCS-January 2026'
 */
export function generateInvoiceNumber(prefix: string, invoiceDate: string): string {
  const date = new Date(invoiceDate);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${prefix}${month} ${year}`;
}
