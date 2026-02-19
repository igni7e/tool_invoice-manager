'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { InvoiceForm, type InvoiceFormData } from '@/components/forms/InvoiceForm';

interface InvoiceDetail {
  id: number;
  clientId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: string;
  notes: string | null;
  notesEn: string | null;
  items: Array<{
    id: number;
    description: string;
    descriptionEn: string | null;
    unitCost: number;
    qty: number;
    taxRate: number;
    currency: string;
    exchangeRate: number | null;
  }>;
}

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => { setInvoice(data as InvoiceDetail); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: InvoiceFormData) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('請求書の更新に失敗しました');
    window.location.href = `/invoices/${id}`;
  };

  if (loading) return <div className='p-8 text-gray-400'>読み込み中...</div>;
  if (!invoice) return <div className='p-8 text-red-500'>請求書が見つかりません</div>;

  const initialData: Partial<InvoiceFormData> = {
    clientId: invoice.clientId,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    status: invoice.status,
    notes: invoice.notes ?? '',
    notesEn: invoice.notesEn ?? '',
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      descriptionEn: item.descriptionEn ?? '',
      unitCost: item.unitCost,
      qty: item.qty,
      taxRate: item.taxRate,
      currency: item.currency,
      exchangeRate: item.exchangeRate ?? 1,
    })),
  };

  return (
    <div>
      <div className='mb-6'>
        <a href={`/invoices/${id}`} className='text-sm text-gray-500 hover:text-gray-700'>
          ← 請求書詳細
        </a>
        <h1 className='text-2xl font-bold text-gray-900 mt-2'>
          請求書編集: <span className='font-mono'>{invoice.invoiceNumber}</span>
        </h1>
      </div>
      <InvoiceForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel='更新'
      />
    </div>
  );
}
