'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/rounding';

interface InvoiceItem {
  id: number;
  description: string;
  descriptionEn: string | null;
  unitCost: number;
  qty: number;
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

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  notes: string | null;
  notesEn: string | null;
  totalJpy: number;
  items: InvoiceItem[];
  client: Client;
}

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => setInvoice(data as Invoice));
  }, [id]);

  if (!invoice) return <div className='p-8'>読み込み中...</div>;

  const isJa = lang === 'ja';
  const subtotal = invoice.items.reduce(
    (s, item) => s + Math.floor(item.unitCost * item.qty * (item.exchangeRate ?? 1)), 0
  );
  const tax = invoice.totalJpy - subtotal;

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
      <div className='no-print fixed top-4 right-4 flex gap-2 z-10'>
        <button
          onClick={() => setLang(isJa ? 'en' : 'ja')}
          className='bg-gray-800 text-white px-3 py-1.5 rounded text-sm'
        >
          {isJa ? 'EN' : 'JA'}
        </button>
        <button
          onClick={() => window.print()}
          className='bg-brand-600 text-white px-4 py-1.5 rounded text-sm font-medium'
        >
          PDFとして保存
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
              <div className='w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold'>I</div>
              <span className='font-bold text-xl text-gray-900'>IGNITE</span>
            </div>
            <p className='text-xs text-gray-500 mt-3'>〒530-0001 大阪府大阪市北区</p>
            <p className='text-xs text-gray-500'>daisuke@igni7e.jp</p>
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
                  <td className='font-medium text-orange-600'>{invoice.dueDate}</td>
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
                    <div className='text-xs text-gray-400'>
                      @ {item.exchangeRate}
                    </div>
                  )}
                </td>
                <td className='py-3 px-4 text-right'>{item.qty}</td>
                <td className='py-3 px-4 text-center text-gray-500'>
                  {(item.taxRate * 100).toFixed(0)}%
                </td>
                <td className='py-3 px-4 text-right font-mono font-medium'>
                  {formatCurrency(item.amountJpy, 'JPY')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 合計 */}
        <div className='flex justify-end mb-10'>
          <div className='w-64'>
            <div className='flex justify-between py-1.5 text-sm text-gray-500'>
              <span>{isJa ? '税抜合計' : 'Subtotal'}</span>
              <span className='font-mono'>{formatCurrency(subtotal, 'JPY')}</span>
            </div>
            <div className='flex justify-between py-1.5 text-sm text-gray-500'>
              <span>{isJa ? '消費税' : 'Consumption Tax'}</span>
              <span className='font-mono'>{formatCurrency(tax, 'JPY')}</span>
            </div>
            <div className='flex justify-between py-2 mt-1 border-t-2 border-gray-900 font-bold text-lg'>
              <span>{isJa ? '合計（税込）' : 'Total'}</span>
              <span className='font-mono text-orange-600'>{formatCurrency(invoice.totalJpy, 'JPY')}</span>
            </div>
          </div>
        </div>

        {/* 振込先 */}
        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6'>
          <p className='text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2'>
            {isJa ? '振込先' : 'Bank Transfer Details'}
          </p>
          <div className='grid grid-cols-2 gap-x-6 text-sm'>
            <div>
              <p className='text-gray-500 text-xs'>{isJa ? '銀行' : 'Bank'}</p>
              <p className='font-medium'>{isJa ? '三井住友銀行 梅田支店' : 'SMBC Umeda Branch'}</p>
            </div>
            <div>
              <p className='text-gray-500 text-xs mt-2'>{isJa ? '口座番号' : 'Account'}</p>
              <p className='font-medium font-mono'>普通 1234567</p>
            </div>
            <div className='col-span-2 mt-2'>
              <p className='text-gray-500 text-xs'>{isJa ? '口座名義' : 'Account Name'}</p>
              <p className='font-medium'>{isJa ? '（有）イグナイト' : 'Ignite LLC'}</p>
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
