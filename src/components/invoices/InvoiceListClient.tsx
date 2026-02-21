'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/rounding';
import InvoiceFilters from './InvoiceFilters';
import InvoicePagination from './InvoicePagination';

interface InvoiceRow {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: string;
  totalJpy: number;
  clientName: string | null;
}

interface ApiResponse {
  data: InvoiceRow[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-600' },
  sent: { label: '送付済み', color: 'bg-blue-100 text-blue-700' },
  paid: { label: '入金済み', color: 'bg-green-100 text-green-700' },
};

export default function InvoiceListClient({ initialParams }: { initialParams: Record<string, string | undefined> }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // q入力だけローカルstate（デバウンス用）
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? initialParams.q ?? '');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const getParam = (key: string) => searchParams.get(key) ?? '';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  // フィルター変更時はページを1にリセット
  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      updateParams({ [key]: value, page: null });
    },
    [updateParams]
  );

  const handleReset = useCallback(() => {
    setInputValue('');
    router.push('?');
  }, [router]);

  const handlePageChange = useCallback(
    (page: number) => {
      updateParams({ page: String(page) });
    },
    [updateParams]
  );

  // qのデバウンス（300ms）
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ q: inputValue || null, page: null });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  // searchParams変化でフェッチ
  useEffect(() => {
    setLoading(true);
    fetch(`/api/invoices?${searchParams.toString()}`)
      .then((r) => r.json())
      .then((data) => { setResult(data as ApiResponse); setLoading(false); })
      .catch(() => setLoading(false));
  }, [searchParams.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterValues = {
    q: getParam('q'),
    status: getParam('status'),
    dateFrom: getParam('dateFrom'),
    dateTo: getParam('dateTo'),
    clientId: getParam('clientId'),
    sort: getParam('sort') || 'date_desc',
  };

  return (
    <div className='card p-0 overflow-hidden'>
      <InvoiceFilters
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleReset}
        inputValue={inputValue}
        onInputChange={setInputValue}
      />

      {loading ? (
        <div className='p-8 text-center text-gray-400'>読み込み中...</div>
      ) : !result || !result.data || result.data.length === 0 ? (
        <div className='p-8 text-center text-gray-400'>請求書がありません</div>
      ) : (
        <>
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
              {result.data.map((inv) => {
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
          <InvoicePagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
