'use client';
import { useState, useEffect } from 'react';
import {
  calcAmountJpy,
  calcTotals,
  formatCurrency,
  calcDueDate,
  generateInvoiceNumber,
  SUPPORTED_CURRENCIES,
} from '@/lib/rounding';

interface Client {
  id: number;
  name: string;
  invoicePrefix: string;
  currency: string;
  taxRate: number;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  descriptionEn: string;
  unitCost: number;
  qty: number;
  taxRate: number;
  currency: string;
  exchangeRate: number;
}

export interface InvoiceFormData {
  clientId: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: string;
  notes: string;
  notesEn: string;
  items: InvoiceItem[];
}

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  submitLabel?: string;
}

const emptyItem = (currency: string, taxRate: number): InvoiceItem => ({
  description: '',
  descriptionEn: '',
  unitCost: 0,
  qty: 1,
  taxRate,
  currency,
  exchangeRate: 1,
});

export function InvoiceForm({ initialData, onSubmit, submitLabel = '保存' }: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<InvoiceFormData>({
    clientId: initialData?.clientId ?? 0,
    invoiceNumber: initialData?.invoiceNumber ?? '',
    invoiceDate: initialData?.invoiceDate ?? new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate ?? '',
    currency: initialData?.currency ?? 'JPY',
    status: initialData?.status ?? 'draft',
    notes: initialData?.notes ?? '',
    notesEn: initialData?.notesEn ?? '',
    items: initialData?.items ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then((data) => setClients(data as Client[]));
  }, []);

  // クライアント選択時に請求書番号と通貨を自動設定
  const handleClientChange = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const invoiceNumber = generateInvoiceNumber(client.invoicePrefix, form.invoiceDate);
    setForm((prev) => ({
      ...prev,
      clientId,
      invoiceNumber,
      currency: client.currency,
      items: prev.items.length === 0
        ? [emptyItem(client.currency, client.taxRate)]
        : prev.items,
    }));
  };

  // 請求日変更時に支払期限と請求書番号を更新
  const handleDateChange = (invoiceDate: string) => {
    const client = clients.find((c) => c.id === form.clientId);
    const invoiceNumber = client
      ? generateInvoiceNumber(client.invoicePrefix, invoiceDate)
      : form.invoiceNumber;
    setForm((prev) => ({
      ...prev,
      invoiceDate,
      dueDate: calcDueDate(invoiceDate),
      invoiceNumber,
    }));
  };

  const addItem = () => {
    const client = clients.find((c) => c.id === form.clientId);
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem(form.currency, client?.taxRate ?? 0.1)],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, key: keyof InvoiceItem, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const totals = calcTotals(form.items);

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

      {/* 基本情報 */}
      <div className='card'>
        <h2 className='text-sm font-semibold text-gray-700 mb-4'>基本情報</h2>
        <div className='grid grid-cols-3 gap-4'>
          <div>
            <label className='label'>クライアント *</label>
            <select
              className='input'
              required
              value={form.clientId || ''}
              onChange={(e) => handleClientChange(parseInt(e.target.value))}
            >
              <option value=''>選択してください</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='label'>請求日 *</label>
            <input
              type='date'
              className='input'
              required
              value={form.invoiceDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className='label'>支払期限</label>
            <input
              type='date'
              className='input'
              value={form.dueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <div>
            <label className='label'>請求書番号</label>
            <input
              className='input font-mono'
              value={form.invoiceNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
              placeholder='自動採番されます'
            />
          </div>
          <div>
            <label className='label'>通貨</label>
            <select
              className='input'
              value={form.currency}
              onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='label'>ステータス</label>
            <select
              className='input'
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value='draft'>下書き</option>
              <option value='sent'>送付済み</option>
              <option value='paid'>入金済み</option>
            </select>
          </div>
        </div>
      </div>

      {/* 明細行 */}
      <div className='card'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-sm font-semibold text-gray-700'>明細</h2>
          <button type='button' onClick={addItem} className='btn-secondary text-sm py-1.5'>
            + 行を追加
          </button>
        </div>

        {form.items.length === 0 ? (
          <p className='text-sm text-gray-400 text-center py-4'>
            「行を追加」ボタンで明細を追加してください
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-2 px-2 text-xs text-gray-500 font-medium w-64'>品名</th>
                  <th className='text-right py-2 px-2 text-xs text-gray-500 font-medium w-28'>単価</th>
                  <th className='text-right py-2 px-2 text-xs text-gray-500 font-medium w-20'>数量</th>
                  <th className='text-center py-2 px-2 text-xs text-gray-500 font-medium w-24'>通貨</th>
                  <th className='text-right py-2 px-2 text-xs text-gray-500 font-medium w-28'>為替レート</th>
                  <th className='text-center py-2 px-2 text-xs text-gray-500 font-medium w-20'>税率</th>
                  <th className='text-right py-2 px-2 text-xs text-gray-500 font-medium w-28'>税込金額(JPY)</th>
                  <th className='w-8'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {form.items.map((item, i) => {
                  const lineJpy = calcAmountJpy(item);
                  const isForeign = item.currency !== 'JPY';
                  return (
                    <tr key={i} className='group'>
                      <td className='py-2 px-2'>
                        <input
                          className='input text-sm py-1.5'
                          value={item.description}
                          onChange={(e) => updateItem(i, 'description', e.target.value)}
                          placeholder='サービス名...'
                          required
                        />
                      </td>
                      <td className='py-2 px-2'>
                        <input
                          type='number'
                          className='input text-sm py-1.5 text-right'
                          value={item.unitCost || ''}
                          onChange={(e) => updateItem(i, 'unitCost', parseFloat(e.target.value) || 0)}
                          min={0}
                          step='any'
                        />
                      </td>
                      <td className='py-2 px-2'>
                        <input
                          type='number'
                          className='input text-sm py-1.5 text-right'
                          value={item.qty}
                          onChange={(e) => updateItem(i, 'qty', parseFloat(e.target.value) || 1)}
                          min={0.01}
                          step='any'
                        />
                      </td>
                      <td className='py-2 px-2'>
                        <select
                          className='input text-sm py-1.5'
                          value={item.currency}
                          onChange={(e) => updateItem(i, 'currency', e.target.value)}
                        >
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className='py-2 px-2'>
                        <input
                          type='number'
                          className={`input text-sm py-1.5 text-right ${!isForeign ? 'bg-gray-50 text-gray-300' : ''}`}
                          value={item.exchangeRate}
                          onChange={(e) => updateItem(i, 'exchangeRate', parseFloat(e.target.value) || 1)}
                          disabled={!isForeign}
                          step='any'
                          min={0.0001}
                        />
                      </td>
                      <td className='py-2 px-2'>
                        <select
                          className='input text-sm py-1.5 text-center'
                          value={item.taxRate}
                          onChange={(e) => updateItem(i, 'taxRate', parseFloat(e.target.value))}
                        >
                          <option value={0}>0%</option>
                          <option value={0.08}>8%</option>
                          <option value={0.1}>10%</option>
                        </select>
                      </td>
                      <td className='py-2 px-2 text-right font-mono font-medium'>
                        {formatCurrency(lineJpy, 'JPY')}
                        {isForeign && (
                          <div className='text-xs text-gray-400'>
                            {formatCurrency(item.unitCost * item.qty, item.currency)}
                          </div>
                        )}
                      </td>
                      <td className='py-2 px-1'>
                        <button
                          type='button'
                          onClick={() => removeItem(i)}
                          className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-lg leading-none'
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 合計 */}
        {form.items.length > 0 && (
          <div className='mt-4 pt-4 border-t border-gray-200 flex justify-end'>
            <div className='w-64 space-y-1 text-sm'>
              <div className='flex justify-between text-gray-500'>
                <span>税抜合計</span>
                <span className='font-mono'>{formatCurrency(totals.subtotalJpy, 'JPY')}</span>
              </div>
              <div className='flex justify-between text-gray-500'>
                <span>消費税</span>
                <span className='font-mono'>{formatCurrency(totals.taxJpy, 'JPY')}</span>
              </div>
              <div className='flex justify-between font-bold text-base pt-1 border-t border-gray-200'>
                <span>合計（税込）</span>
                <span className='font-mono text-brand-600'>{formatCurrency(totals.totalJpy, 'JPY')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 備考 */}
      <div className='card'>
        <h2 className='text-sm font-semibold text-gray-700 mb-4'>備考</h2>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='label'>備考（日本語）</label>
            <textarea
              className='input h-20 resize-none'
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <div>
            <label className='label'>備考（英語）</label>
            <textarea
              className='input h-20 resize-none'
              value={form.notesEn}
              onChange={(e) => setForm((prev) => ({ ...prev, notesEn: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className='flex justify-end gap-3'>
        <a href='/invoices' className='btn-secondary'>キャンセル</a>
        <button type='submit' disabled={saving} className='btn-primary'>
          {saving ? '保存中...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
