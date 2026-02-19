'use client';
import { useState } from 'react';
import { SUPPORTED_CURRENCIES } from '@/lib/rounding';

interface ClientFormData {
  name: string;
  nameEn: string;
  address: string;
  addressEn: string;
  contactName: string;
  contactEmail: string;
  invoicePrefix: string;
  currency: string;
  taxRate: number;
}

interface ClientFormProps {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  submitLabel?: string;
}

export function ClientForm({ initialData, onSubmit, submitLabel = '保存' }: ClientFormProps) {
  const [form, setForm] = useState<ClientFormData>({
    name: initialData?.name ?? '',
    nameEn: initialData?.nameEn ?? '',
    address: initialData?.address ?? '',
    addressEn: initialData?.addressEn ?? '',
    contactName: initialData?.contactName ?? '',
    contactEmail: initialData?.contactEmail ?? '',
    invoicePrefix: initialData?.invoicePrefix ?? '',
    currency: initialData?.currency ?? 'JPY',
    taxRate: initialData?.taxRate ?? 0.1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof ClientFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
          {error}
        </div>
      )}

      <div className='card'>
        <h2 className='text-sm font-semibold text-gray-700 mb-4'>基本情報</h2>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='label'>クライアント名 *</label>
            <input
              className='input'
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder='株式会社〇〇'
            />
          </div>
          <div>
            <label className='label'>英語表記</label>
            <input
              className='input'
              value={form.nameEn}
              onChange={(e) => update('nameEn', e.target.value)}
              placeholder='Company Name Ltd.'
            />
          </div>
          <div>
            <label className='label'>住所</label>
            <input
              className='input'
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
            />
          </div>
          <div>
            <label className='label'>住所（英語）</label>
            <input
              className='input'
              value={form.addressEn}
              onChange={(e) => update('addressEn', e.target.value)}
            />
          </div>
          <div>
            <label className='label'>担当者名</label>
            <input
              className='input'
              value={form.contactName}
              onChange={(e) => update('contactName', e.target.value)}
            />
          </div>
          <div>
            <label className='label'>担当者メール</label>
            <input
              type='email'
              className='input'
              value={form.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='card'>
        <h2 className='text-sm font-semibold text-gray-700 mb-4'>請求書設定</h2>
        <div className='grid grid-cols-3 gap-4'>
          <div>
            <label className='label'>請求書番号プレフィックス *</label>
            <input
              className='input font-mono'
              required
              value={form.invoicePrefix}
              onChange={(e) => update('invoicePrefix', e.target.value)}
              placeholder='NLCS-'
            />
            <p className='text-xs text-gray-400 mt-1'>
              例: NLCS- → NLCS-January 2026
            </p>
          </div>
          <div>
            <label className='label'>デフォルト通貨</label>
            <select
              className='input'
              value={form.currency}
              onChange={(e) => update('currency', e.target.value)}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='label'>消費税率</label>
            <select
              className='input'
              value={form.taxRate}
              onChange={(e) => update('taxRate', parseFloat(e.target.value))}
            >
              <option value={0}>0%（非課税）</option>
              <option value={0.08}>8%（軽減税率）</option>
              <option value={0.1}>10%</option>
            </select>
          </div>
        </div>
      </div>

      <div className='flex justify-end gap-3'>
        <a href='/clients' className='btn-secondary'>キャンセル</a>
        <button type='submit' disabled={saving} className='btn-primary'>
          {saving ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
