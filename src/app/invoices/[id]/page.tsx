'use client';
export const runtime = 'edge';
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

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: string;
  notes: string | null;
  notesEn: string | null;
  totalJpy: number;
  clientId: number;
  items: InvoiceItem[];
  client?: { name: string; address: string | null; contactEmail: string | null };
}

const STATUS_MAP: Record<string, string> = { draft: '下書き', sent: '送付済み', paid: '入金済み' };

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => { setInvoice(data as Invoice); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className='p-8 text-gray-400'>読み込み中...</div>;
  if (!invoice) return <div className='p-8 text-red-500'>請求書が見つかりません</div>;

  const subtotal = invoice.items.reduce(
    (s, item) => s + Math.floor(item.unitCost * item.qty * (item.exchangeRate ?? 1)), 0
  );
  const tax = invoice.totalJpy - subtotal;

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <a href='/invoices' className='text-sm text-gray-500 hover:text-gray-700'>
            ← 請求書一覧
          </a>
          <h1 className='text-2xl font-bold text-gray-900 mt-2 font-mono'>
            {invoice.invoiceNumber}
          </h1>
        </div>
        <div className='flex gap-3'>
          <a
            href={`/invoices/${id}/print`}
            target='_blank'
            className='btn-secondary'
          >
            PDF出力
          </a>
          <a href={`/invoices/${invoice.id}/edit`} className='btn-primary'>
            編集
          </a>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-6 mb-6'>
        <div className='card'>
          <p className='text-xs text-gray-500 mb-1'>ステータス</p>
          <p className='font-medium'>{STATUS_MAP[invoice.status] ?? invoice.status}</p>
        </div>
        <div className='card'>
          <p className='text-xs text-gray-500 mb-1'>請求日 / 支払期限</p>
          <p className='font-medium'>{invoice.invoiceDate} → {invoice.dueDate}</p>
        </div>
        <div className='card'>
          <p className='text-xs text-gray-500 mb-1'>合計金額（税込）</p>
          <p className='text-2xl font-bold text-brand-600'>
            {formatCurrency(invoice.totalJpy, 'JPY')}
          </p>
        </div>
      </div>

      <div className='card mb-6'>
        <h2 className='text-sm font-semibold text-gray-700 mb-4'>明細</h2>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-gray-200'>
              <th className='table-header text-left'>品名</th>
              <th className='table-header text-right'>単価</th>
              <th className='table-header text-right'>数量</th>
              <th className='table-header text-center'>通貨</th>
              <th className='table-header text-center'>税率</th>
              <th className='table-header text-right'>税込金額(JPY)</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td className='table-cell'>{item.description}</td>
                <td className='table-cell text-right font-mono'>
                  {formatCurrency(item.unitCost, item.currency)}
                  {item.currency !== 'JPY' && item.exchangeRate && (
                    <div className='text-xs text-gray-400'>
                      × {item.exchangeRate.toLocaleString()}
                    </div>
                  )}
                </td>
                <td className='table-cell text-right'>{item.qty}</td>
                <td className='table-cell text-center'>{item.currency}</td>
                <td className='table-cell text-center'>{(item.taxRate * 100).toFixed(0)}%</td>
                <td className='table-cell text-right font-mono font-medium'>
                  {formatCurrency(item.amountJpy, 'JPY')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className='mt-4 pt-4 border-t border-gray-200 flex justify-end'>
          <div className='w-64 space-y-1 text-sm'>
            <div className='flex justify-between text-gray-500'>
              <span>税抜合計</span>
              <span className='font-mono'>{formatCurrency(subtotal, 'JPY')}</span>
            </div>
            <div className='flex justify-between text-gray-500'>
              <span>消費税</span>
              <span className='font-mono'>{formatCurrency(tax, 'JPY')}</span>
            </div>
            <div className='flex justify-between font-bold text-base pt-1 border-t border-gray-200'>
              <span>合計（税込）</span>
              <span className='font-mono text-brand-600'>
                {formatCurrency(invoice.totalJpy, 'JPY')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.notesEn) && (
        <div className='card'>
          <h2 className='text-sm font-semibold text-gray-700 mb-3'>備考</h2>
          <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
            {invoice.notes && <p>{invoice.notes}</p>}
            {invoice.notesEn && <p>{invoice.notesEn}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
