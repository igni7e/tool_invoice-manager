'use client';
import { ClientForm } from '@/components/forms/ClientForm';

interface ClientFormData {
  name: string; nameEn: string; address: string; addressEn: string;
  contactName: string; contactEmail: string; invoicePrefix: string;
  currency: string; taxRate: number;
}

export default function NewClientPage() {
  const handleSubmit = async (data: ClientFormData) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('クライアントの作成に失敗しました');
    window.location.href = '/clients';
  };

  return (
    <div>
      <div className='mb-6'>
        <a href='/clients' className='text-sm text-gray-500 hover:text-gray-700'>
          ← クライアント一覧
        </a>
        <h1 className='text-2xl font-bold text-gray-900 mt-2'>新規クライアント</h1>
      </div>
      <ClientForm onSubmit={handleSubmit} submitLabel='作成' />
    </div>
  );
}
