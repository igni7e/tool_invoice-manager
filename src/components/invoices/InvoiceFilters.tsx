'use client';

import { useEffect, useState } from 'react';

interface Client {
  id: number;
  name: string;
}

interface FilterValues {
  q: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  clientId: string;
  sort: string;
}

interface Props {
  values: FilterValues;
  onChange: (key: keyof FilterValues, value: string | null) => void;
  onReset: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
}

const STATUS_OPTIONS = [
  { value: '', label: '全て' },
  { value: 'draft', label: '下書き' },
  { value: 'sent', label: '送付済み' },
  { value: 'paid', label: '入金済み' },
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: '日付（新しい順）' },
  { value: 'date_asc', label: '日付（古い順）' },
  { value: 'amount_desc', label: '金額（多い順）' },
  { value: 'amount_asc', label: '金額（少ない順）' },
];

export default function InvoiceFilters({ values, onChange, onReset, inputValue, onInputChange }: Props) {
  const [clientList, setClientList] = useState<Client[]>([]);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => setClientList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const hasActiveFilters =
    values.q || values.status || values.dateFrom || values.dateTo || values.clientId;

  return (
    <div className='p-4 border-b border-gray-200 space-y-3'>
      {/* 1行目: 検索・並び順 */}
      <div className='flex gap-3'>
        <div className='flex-1 relative'>
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>🔍</span>
          <input
            type='text'
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder='番号・クライアント・メモで検索'
            className='input pl-8 w-full'
          />
        </div>
        <select
          value={values.sort}
          onChange={(e) => onChange('sort', e.target.value)}
          className='input w-48'
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 2行目: ステータス・日付範囲 */}
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex gap-1'>
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => onChange('status', o.value || null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                values.status === o.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className='flex items-center gap-2 ml-auto'>
          <input
            type='date'
            value={values.dateFrom}
            onChange={(e) => onChange('dateFrom', e.target.value || null)}
            className='input text-sm'
          />
          <span className='text-gray-400 text-sm'>〜</span>
          <input
            type='date'
            value={values.dateTo}
            onChange={(e) => onChange('dateTo', e.target.value || null)}
            className='input text-sm'
          />
        </div>
      </div>

      {/* 3行目: クライアント・リセット */}
      <div className='flex items-center gap-3'>
        <select
          value={values.clientId}
          onChange={(e) => onChange('clientId', e.target.value || null)}
          className='input w-52'
        >
          <option value=''>クライアント（全て）</option>
          {clientList.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className='text-sm text-gray-500 hover:text-gray-700 underline'
          >
            フィルタをリセット
          </button>
        )}
      </div>
    </div>
  );
}
