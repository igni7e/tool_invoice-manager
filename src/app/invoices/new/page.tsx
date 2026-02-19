'use client';
import { InvoiceForm, type InvoiceFormData } from '@/components/forms/InvoiceForm';

export default function NewInvoicePage() {
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

  return (
    <div>
      <div className='mb-6'>
        <a href='/invoices' className='text-sm text-gray-500 hover:text-gray-700'>
          ← 請求書一覧
        </a>
        <h1 className='text-2xl font-bold text-gray-900 mt-2'>新規請求書</h1>
      </div>
      <InvoiceForm onSubmit={handleSubmit} submitLabel='作成' />
    </div>
  );
}
