'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceForm, type InvoiceFormData } from '@/components/forms/InvoiceForm';
import { calcDueDate, generateInvoiceNumber } from '@/lib/rounding';

interface DuplicateSource {
  clientId: number;
  currency: string;
  notes: string | null;
  notesEn: string | null;
  items: Array<{
    description: string;
    descriptionEn: string | null;
    unitCost: number;
    qty: number;
    unit?: string | null;
    taxRate: number;
    currency: string;
    exchangeRate: number | null;
  }>;
  client?: { invoicePrefix: string };
}

function NewInvoiceContent() {
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from');
  const [initialData, setInitialData] = useState<Partial<InvoiceFormData> | undefined>();
  const [loading, setLoading] = useState(!!fromId);

  useEffect(() => {
    if (!fromId) return;
    fetch(`/api/invoices/${fromId}`)
      .then((r) => r.json() as Promise<DuplicateSource>)
      .then((data) => {
        const today = new Date().toISOString().split('T')[0];
        const invoicePrefix = data.client?.invoicePrefix ?? '';
        setInitialData({
          clientId: data.clientId,
          invoiceDate: today,
          dueDate: calcDueDate(today),
          invoiceNumber: generateInvoiceNumber(invoicePrefix, today),
          currency: data.currency,
          notes: data.notes ?? '',
          notesEn: data.notesEn ?? '',
          items: data.items.map((item) => ({
            description: item.description,
            descriptionEn: item.descriptionEn ?? '',
            unitCost: item.unitCost,
            qty: item.qty,
            unit: item.unit ?? '',
            taxRate: item.taxRate,
            currency: item.currency,
            exchangeRate: item.exchangeRate ?? 1,
          })),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fromId]);

  const handleSubmit = async (data: InvoiceFormData) => {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('請求書の作成に失敗しました');
    const inv = await res.json() as { id: number };
    window.location.href = `/invoices/${inv.id}`;
  };

  if (loading) return <div className='p-8 text-gray-400'>読み込み中...</div>;

  return (
    <div>
      <div className='mb-6'>
        <a href='/invoices' className='text-sm text-gray-500 hover:text-gray-700'>
          ← 請求書一覧
        </a>
        <h1 className='text-2xl font-bold text-gray-900 mt-2'>
          {fromId ? '請求書を複製' : '新規請求書'}
        </h1>
      </div>
      <InvoiceForm initialData={initialData} onSubmit={handleSubmit} submitLabel='作成' />
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className='p-8 text-gray-400'>読み込み中...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
