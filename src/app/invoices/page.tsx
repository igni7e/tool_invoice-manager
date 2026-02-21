export const runtime = 'edge';

import { Suspense } from 'react';
import InvoiceListClient from '@/components/invoices/InvoiceListClient';

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>請求書</h1>
        <a href='/invoices/new' className='btn-primary'>
          + 新規作成
        </a>
      </div>
      <Suspense fallback={<div className='p-8 text-center text-gray-400'>読み込み中...</div>}>
        <InvoiceListClient initialParams={params} />
      </Suspense>
    </div>
  );
}
