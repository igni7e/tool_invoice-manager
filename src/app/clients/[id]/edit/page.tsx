'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ClientForm } from '@/components/forms/ClientForm';

interface ClientFormData {
  name: string; nameEn: string; address: string; addressEn: string;
  contactName: string; contactEmail: string; invoicePrefix: string;
  currency: string; taxRate: number;
}

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<ClientFormData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setInitialData(data as ClientFormData); })
      .catch(() => setNotFound(true));
  }, [id]);

  const handleSubmit = async (data: ClientFormData) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('クライアントの更新に失敗しました');
    window.location.href = '/clients';
  };

  return (
    <div>
      <div className='mb-6'>
        <a href='/clients' className='text-sm text-gray-500 hover:text-gray-700'>
          ← クライアント一覧
        </a>
        <h1 className='text-2xl font-bold text-gray-900 mt-2'>クライアント編集</h1>
      </div>

      {notFound ? (
        <div className='card text-center text-gray-500'>クライアントが見つかりません</div>
      ) : initialData === null ? (
        <div className='card text-center text-gray-400'>読み込み中...</div>
      ) : (
        <ClientForm initialData={initialData} onSubmit={handleSubmit} submitLabel='更新' />
      )}
    </div>
  );
}
