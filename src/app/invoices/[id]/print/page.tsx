'use client';
export const runtime = 'edge';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency, calcSubtotalJpy } from '@/lib/rounding';
import type { InvoicePdfData } from '@/components/pdf/InvoiceDocument';

// @react-pdf/renderer はSSRで動作しないため dynamic import
const PdfDownloadButton = lazy(() =>
  import('@/components/pdf/PdfDownloadButton').then((m) => ({ default: m.PdfDownloadButton }))
);

interface InvoiceItem {
  id: number;
  description: string;
  descriptionEn: string | null;
  unitCost: number;
  qty: number;
  unit: string | null;
  taxRate: number;
  currency: string;
  exchangeRate: number | null;
  amountJpy: number;
}

interface Client {
  name: string;
  nameEn: string | null;
  address: string | null;
  addressEn: string | null;
  contactName: string | null;
}

interface BankAccountData {
  bankName?: string;
  bankBranch?: string;
  bankNameEn?: string;
  bankBranchEn?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountHolderEn?: string;
  bankCode?: string;
  swiftCode?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  notes: string | null;
  notesEn: string | null;
  totalJpy: number;
  bankAccountId: number | null;
  items: InvoiceItem[];
  client: Client;
  bankAccount?: BankAccountData | null;
}

interface Settings {
  companyName?: string;
  companyAddress?: string;
  companyAddressEn?: string;
  bankName?: string;
  bankBranch?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountHolderEn?: string;
  taxRegistrationNumber?: string;
  bankCode?: string;
  swiftCode?: string;
  bankNameEn?: string;
  bankBranchEn?: string;
}

// 税率別合計を計算（calcSubtotalJpy で丸め規則を統一）
function calcTaxBreakdown(items: InvoiceItem[]) {
  const map = new Map<number, { subtotal: number; tax: number }>();
  for (const item of items) {
    const subtotal = calcSubtotalJpy({
      unitCost: item.unitCost,
      qty: item.qty,
      exchangeRate: item.exchangeRate ?? 1,
      taxRate: item.taxRate,
    });
    const taxAmt = item.amountJpy - subtotal;
    const existing = map.get(item.taxRate) ?? { subtotal: 0, tax: 0 };
    map.set(item.taxRate, {
      subtotal: existing.subtotal + subtotal,
      tax: existing.tax + taxAmt,
    });
  }
  return map;
}

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  useEffect(() => {
    Promise.all([
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([inv, s]) => {
      setInvoice(inv as Invoice);
      setSettings(s as Settings);
    });
  }, [id]);

  if (!invoice) return <div className='p-8'>読み込み中...</div>;

  const isJa = lang === 'ja';
  const taxBreakdown = calcTaxBreakdown(invoice.items);
  const has8 = taxBreakdown.has(0.08);

  const ba = invoice.bankAccount;
  const bankNameJa = ba?.bankName ?? settings.bankName ?? '三井住友銀行';
  const bankBranchJa = ba?.bankBranch ?? settings.bankBranch ?? '梅田支店';
  const bankName = isJa ? bankNameJa : (ba?.bankNameEn ?? settings.bankNameEn ?? bankNameJa);
  const bankBranch = isJa ? bankBranchJa : (ba?.bankBranchEn ?? settings.bankBranchEn ?? bankBranchJa);
  const accountTypeRaw = ba?.accountType ?? settings.accountType ?? '普通';
  const accountType = isJa
    ? accountTypeRaw
    : (accountTypeRaw === '普通' ? 'Ordinary' : accountTypeRaw === '当座' ? 'Checking' : accountTypeRaw);
  const accountNumber = ba?.accountNumber ?? settings.accountNumber ?? '1234567';
  const accountHolder = isJa
    ? (ba?.accountHolder ?? settings.accountHolder ?? '（有）イグナイト')
    : (ba?.accountHolderEn ?? settings.accountHolderEn ?? 'Ignite LLC');
  const swiftCode = ba?.swiftCode ?? settings.swiftCode;
  const companyAddress = isJa
    ? (settings.companyAddress ?? '〒530-0001 大阪府大阪市北区')
    : (settings.companyAddressEn ?? '530-0001 Osaka, Japan');

  const pdfData: InvoicePdfData = {
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      notesEn: invoice.notesEn,
      totalJpy: invoice.totalJpy,
    },
    client: {
      name: invoice.client.name,
      nameEn: invoice.client.nameEn,
      address: invoice.client.address,
      addressEn: invoice.client.addressEn,
    },
    items: invoice.items,
    settings: {
      companyName: settings.companyName ?? null,
      companyAddress: settings.companyAddress ?? null,
      companyAddressEn: settings.companyAddressEn ?? null,
      bankName: settings.bankName ?? null,
      bankBranch: settings.bankBranch ?? null,
      accountType: settings.accountType ?? null,
      accountNumber: settings.accountNumber ?? null,
      accountHolder: settings.accountHolder ?? null,
      accountHolderEn: settings.accountHolderEn ?? null,
      taxRegistrationNumber: settings.taxRegistrationNumber ?? null,
      bankCode: settings.bankCode ?? null,
      swiftCode: settings.swiftCode ?? null,
      bankNameEn: settings.bankNameEn ?? null,
      bankBranchEn: settings.bankBranchEn ?? null,
    },
    bankAccount: invoice.bankAccount ?? null,
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { size: A4; margin: 20mm 15mm; }
        body { font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic Pro', sans-serif; }
      `}</style>

      {/* 印刷時非表示のコントロール */}
      <div className='no-print fixed top-4 left-4 flex gap-2 z-10'>
        <button
          onClick={() => setLang(isJa ? 'en' : 'ja')}
          className='bg-gray-800 text-white px-3 py-1.5 rounded text-sm'
        >
          {isJa ? 'EN' : 'JA'}
        </button>
        <Suspense
          fallback={
            <button className='bg-brand-600 text-white px-4 py-1.5 rounded text-sm font-medium opacity-60'>
              PDF準備中...
            </button>
          }
        >
          <PdfDownloadButton data={pdfData} lang={lang} invoiceNumber={invoice.invoiceNumber} />
        </Suspense>
        <button
          onClick={() => window.print()}
          className='bg-gray-700 text-white px-3 py-1.5 rounded text-sm'
        >
          印刷
        </button>
        <a
          href={`/invoices/${id}`}
          className='bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm'
        >
          ✕
        </a>
      </div>

      {/* 請求書本体 */}
      <div className='max-w-3xl mx-auto p-12 bg-white min-h-screen'>
        {/* ヘッダー */}
        <div className='flex justify-between items-start mb-12'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <div className='w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white font-bold'>I</div>
              <span className='font-bold text-xl text-gray-900'>
                {settings.companyName ?? 'IGNITE'}
              </span>
            </div>
            <p className='text-xs text-gray-500 mt-3 whitespace-pre-line'>{companyAddress}</p>
            {settings.taxRegistrationNumber && (
              <p className='text-xs text-gray-500 mt-1'>
                {isJa ? '登録番号: ' : 'Tax Reg. No.: '}{settings.taxRegistrationNumber}
              </p>
            )}
          </div>
          <div className='text-right'>
            <h1 className='text-3xl font-bold text-gray-900 mb-1'>
              {isJa ? '請求書' : 'INVOICE'}
            </h1>
            <p className='text-sm font-mono text-gray-600'>{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* 請求先 / 日付 */}
        <div className='flex justify-between mb-10'>
          <div>
            <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2'>
              {isJa ? '請求先' : 'Bill To'}
            </p>
            <p className='font-semibold text-gray-900 text-lg'>
              {isJa ? invoice.client.name : (invoice.client.nameEn ?? invoice.client.name)}
            </p>
            {invoice.client.address && (
              <p className='text-sm text-gray-500 mt-1 whitespace-pre-line'>
                {isJa ? invoice.client.address : (invoice.client.addressEn ?? invoice.client.address)}
              </p>
            )}
          </div>
          <div className='text-right'>
            <table className='text-sm'>
              <tbody>
                <tr>
                  <td className='text-gray-500 pr-4 py-0.5'>{isJa ? '請求日' : 'Invoice Date'}</td>
                  <td className='font-medium'>{invoice.invoiceDate}</td>
                </tr>
                <tr>
                  <td className='text-gray-500 pr-4 py-0.5'>{isJa ? '支払期限' : 'Due Date'}</td>
                  <td className='font-medium text-brand-600'>{invoice.dueDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 明細テーブル */}
        <table className='w-full mb-6 text-sm'>
          <thead>
            <tr className='bg-gray-900 text-white'>
              <th className='py-3 px-4 text-left font-medium rounded-tl-lg'>
                {isJa ? '品名' : 'Description'}
              </th>
              <th className='py-3 px-4 text-right font-medium'>
                {isJa ? '単価' : 'Unit Price'}
              </th>
              <th className='py-3 px-4 text-right font-medium'>
                {isJa ? '数量' : 'Qty'}
              </th>
              <th className='py-3 px-4 text-center font-medium'>
                {isJa ? '税率' : 'Tax'}
              </th>
              <th className='py-3 px-4 text-right font-medium rounded-tr-lg'>
                {isJa ? '金額(JPY)' : 'Amount(JPY)'}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className='py-3 px-4'>
                  {isJa ? item.description : (item.descriptionEn ?? item.description)}
                </td>
                <td className='py-3 px-4 text-right font-mono'>
                  {formatCurrency(item.unitCost, item.currency)}
                  {item.currency !== 'JPY' && item.exchangeRate && (
                    <div className='text-xs text-gray-400'>@ {item.exchangeRate}</div>
                  )}
                </td>
                <td className='py-3 px-4 text-right'>
                  {item.qty}{item.unit ? <span className='text-gray-500 ml-0.5 text-xs'>{item.unit}</span> : ''}
                </td>
                <td className='py-3 px-4 text-center text-gray-500'>
                  {(item.taxRate * 100).toFixed(0)}%{item.taxRate === 0.08 ? ' ※' : ''}
                </td>
                <td className='py-3 px-4 text-right font-mono font-medium'>
                  {formatCurrency(item.amountJpy, 'JPY')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 合計（税率別） */}
        <div className='flex justify-end mb-10'>
          <div className='w-72'>
            {Array.from(taxBreakdown.entries())
              .sort(([a], [b]) => b - a)
              .map(([rate, { subtotal, tax }]) => (
                <div key={rate}>
                  <div className='flex justify-between py-1 text-sm text-gray-500'>
                    <span>
                      {(rate * 100).toFixed(0)}%{isJa ? '対象計' : ' subject'}
                      {rate === 0.08 ? ' ※' : ''}
                    </span>
                    <span className='font-mono'>{formatCurrency(subtotal, 'JPY')}</span>
                  </div>
                  <div className='flex justify-between py-1 text-sm text-gray-500'>
                    <span>
                      {isJa ? `消費税(${(rate * 100).toFixed(0)}%)` : `Tax(${(rate * 100).toFixed(0)}%)`}
                    </span>
                    <span className='font-mono'>{formatCurrency(tax, 'JPY')}</span>
                  </div>
                </div>
              ))
            }
            <div className='flex justify-between py-2 mt-1 border-t-2 border-gray-900 font-bold text-lg'>
              <span>{isJa ? '合計（税込）' : 'Total'}</span>
              <span className='font-mono text-brand-600'>{formatCurrency(invoice.totalJpy, 'JPY')}</span>
            </div>
            {has8 && (
              <p className='text-xs text-gray-400 mt-1'>
                ※ {isJa ? '軽減税率（8%）対象' : 'Reduced tax rate (8%) applicable'}
              </p>
            )}
          </div>
        </div>

        {/* 振込先 */}
        <div className='bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6'>
          <p className='text-xs font-semibold text-brand-700 uppercase tracking-wider mb-2'>
            {isJa ? '振込先' : 'Bank Transfer Details'}
          </p>
          <div className='grid grid-cols-2 gap-x-6 text-sm'>
            <div>
              <p className='text-gray-500 text-xs'>{isJa ? '銀行' : 'Bank'}</p>
              <p className='font-medium'>{bankName} {bankBranch}</p>
            </div>
            <div>
              <p className='text-gray-500 text-xs mt-2'>{isJa ? '口座番号' : 'Account'}</p>
              <p className='font-medium font-mono'>{accountType} {accountNumber}</p>
            </div>
            {!isJa && swiftCode && (
              <div className='mt-2'>
                <p className='text-gray-500 text-xs'>SWIFT/BIC</p>
                <p className='font-medium font-mono'>{swiftCode}</p>
              </div>
            )}
            <div className='col-span-2 mt-2'>
              <p className='text-gray-500 text-xs'>{isJa ? '口座名義' : 'Account Name'}</p>
              <p className='font-medium'>{accountHolder}</p>
            </div>
          </div>
        </div>

        {/* 備考 */}
        {(invoice.notes || invoice.notesEn) && (
          <div className='text-sm text-gray-500'>
            <p className='font-medium text-gray-700 mb-1'>
              {isJa ? '備考' : 'Notes'}
            </p>
            <p className='whitespace-pre-line'>
              {isJa ? invoice.notes : (invoice.notesEn ?? invoice.notes)}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
