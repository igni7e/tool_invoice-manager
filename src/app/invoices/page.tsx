'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/rounding';

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: string;
  totalJpy: number;
  clientName?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-600' },
  sent: { label: '送付済み', color: 'bg-blue-100 text-blue-700' },
  paid: { label: '入金済み', color: 'bg-green-100 text-green-700' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((data) => { setInvoices(data as Invoice[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>請求書</h1>
        <a href='/invoices/new' className='btn-primary'>
          + 新規作成
        </a>
      </div>

      <div className='card p-0 overflow-hidden'>
        {loading ? (
          <div className='p-8 text-center text-gray-400'>読み込み中...</div>
        ) : invoices.length === 0 ? (
          <div className='p-8 text-center text-gray-400'>請求書がありません</div>
        ) : (
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='table-header text-left'>請求書番号</th>
                <th className='table-header text-left'>クライアント</th>
                <th className='table-header text-left'>請求日</th>
                <th className='table-header text-left'>支払期限</th>
                <th className='table-header text-right'>金額</th>
                <th className='table-header text-center'>ステータス</th>
                <th className='table-header'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {invoices.map((inv) => {
                const status = STATUS_LABELS[inv.status] ?? STATUS_LABELS['draft'];
                return (
                  <tr key={inv.id} className='hover:bg-gray-50'>
                    <td className='table-cell font-mono font-medium text-sm'>
                      {inv.invoiceNumber}
                    </td>
                    <td className='table-cell'>{inv.clientName ?? '—'}</td>
                    <td className='table-cell text-gray-500'>{inv.invoiceDate}</td>
                    <td className='table-cell text-gray-500'>{inv.dueDate}</td>
                    <td className='table-cell text-right font-medium'>
                      {formatCurrency(inv.totalJpy, 'JPY')}
                    </td>
                    <td className='table-cell text-center'>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className='table-cell text-right'>
                      <a
                        href={`/invoices/${inv.id}`}
                        className='text-brand-600 hover:text-brand-700 text-sm font-medium'
                      >
                        詳細
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
