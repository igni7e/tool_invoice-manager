'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientId: number;
  totalJpy: number;
  status: string;
}

interface Client {
  id: number;
  name: string;
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/invoices').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([invData, cliData]) => {
      setInvoices((invData as { data: Invoice[] }).data ?? []);
      setClients((cliData as Client[]) ?? []);
      setLoading(false);
    });
  }, []);

  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const thisMonthInvoices = invoices.filter((inv) =>
    inv.invoiceDate.startsWith(currentMonth)
  );
  const thisMonthTotal = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalJpy, 0);

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const recent = [...invoices]
    .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
    .slice(0, 5);

  const fmt = (n: number) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-900 mb-6'>ダッシュボード</h1>
      <div className='grid grid-cols-1 gap-6 mb-8'>
        <StatCard
          label='今月の請求総額'
          value={loading ? '---' : fmt(thisMonthTotal)}
          sub={loading ? '' : `${thisMonthInvoices.length}件`}
        />
      </div>
      <div className='card'>
        <h2 className='text-lg font-semibold mb-4'>最近の請求書</h2>
        {loading ? (
          <p className='text-sm text-gray-500'>読み込み中...</p>
        ) : recent.length === 0 ? (
          <p className='text-sm text-gray-500'>請求書がありません</p>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-2 text-gray-500 font-medium'>請求書番号</th>
                <th className='text-left py-2 text-gray-500 font-medium'>請求日</th>
                <th className='text-left py-2 text-gray-500 font-medium'>クライアント</th>
                <th className='text-right py-2 text-gray-500 font-medium'>金額</th>
                <th className='text-center py-2 text-gray-500 font-medium'>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((inv) => (
                <tr key={inv.id} className='border-b border-gray-100 hover:bg-gray-50'>
                  <td className='py-2'>
                    <a href={`/invoices/${inv.id}`} className='text-brand-600 hover:underline font-mono text-xs'>
                      {inv.invoiceNumber}
                    </a>
                  </td>
                  <td className='py-2 text-gray-600'>{inv.invoiceDate}</td>
                  <td className='py-2 text-gray-900'>{clientMap.get(inv.clientId) ?? '—'}</td>
                  <td className='py-2 text-right font-mono font-medium'>{fmt(inv.totalJpy)}</td>
                  <td className='py-2 text-center'>
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className='card'>
      <p className='text-sm text-gray-500 mb-1'>{label}</p>
      <p className='text-2xl font-bold text-gray-900'>{value}</p>
      {sub && <p className='text-sm text-gray-400 mt-1'>{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: '下書き', cls: 'bg-gray-100 text-gray-600' },
    sent: { label: '送付済', cls: 'bg-blue-100 text-blue-700' },
    paid: { label: '入金済', cls: 'bg-green-100 text-green-700' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
