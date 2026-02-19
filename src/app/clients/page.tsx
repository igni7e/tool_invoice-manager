'use client';
import { useEffect, useState } from 'react';

interface Client {
  id: number;
  name: string;
  nameEn: string | null;
  invoicePrefix: string;
  currency: string;
  taxRate: number;
  contactEmail: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => { setClients(data as Client[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>クライアント</h1>
        <a href='/clients/new' className='btn-primary'>
          + 新規作成
        </a>
      </div>

      <div className='card p-0 overflow-hidden'>
        {loading ? (
          <div className='p-8 text-center text-gray-400'>読み込み中...</div>
        ) : clients.length === 0 ? (
          <div className='p-8 text-center text-gray-400'>
            クライアントが登録されていません
          </div>
        ) : (
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='table-header text-left'>クライアント名</th>
                <th className='table-header text-left'>請求書番号プレフィックス</th>
                <th className='table-header text-left'>デフォルト通貨</th>
                <th className='table-header text-left'>税率</th>
                <th className='table-header text-left'>連絡先</th>
                <th className='table-header'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {clients.map((client) => (
                <tr key={client.id} className='hover:bg-gray-50'>
                  <td className='table-cell font-medium'>
                    <div>{client.name}</div>
                    {client.nameEn && (
                      <div className='text-xs text-gray-400'>{client.nameEn}</div>
                    )}
                  </td>
                  <td className='table-cell'>
                    <code className='bg-gray-100 px-2 py-0.5 rounded text-xs font-mono'>
                      {client.invoicePrefix}
                    </code>
                  </td>
                  <td className='table-cell'>{client.currency}</td>
                  <td className='table-cell'>{(client.taxRate * 100).toFixed(0)}%</td>
                  <td className='table-cell text-gray-500'>{client.contactEmail ?? '—'}</td>
                  <td className='table-cell text-right'>
                    <a
                      href={`/clients/${client.id}/edit`}
                      className='text-brand-600 hover:text-brand-700 text-sm font-medium'
                    >
                      編集
                    </a>
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
