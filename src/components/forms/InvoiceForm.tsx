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
  unit: string;
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
  bankAccountId: number | null;
  items: InvoiceItem[];
}

interface BankAccount {
  id: number;
  label: string;
  isDefault?: number;
}

interface NewClientForm {
  name: string;
  invoicePrefix: string;
  currency: string;
  taxRate: number;
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
  unit: '',
  taxRate,
  currency,
  exchangeRate: 1,
});

export function InvoiceForm({ initialData, onSubmit, submitLabel = '保存' }: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<InvoiceFormData>({
    clientId: initialData?.clientId ?? 0,
    invoiceNumber: initialData?.invoiceNumber ?? '',
    invoiceDate: initialData?.invoiceDate ?? today,
    dueDate: initialData?.dueDate ?? calcDueDate(initialData?.invoiceDate ?? today),
    currency: initialData?.currency ?? 'JPY',
    status: 'draft',
    notes: initialData?.notes ?? '',
    notesEn: initialData?.notesEn ?? '',
    bankAccountId: (initialData as Record<string, unknown>)?.bankAccountId as number | null ?? null,
    items: initialData?.items ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // インラインクライアント作成モーダル
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState<NewClientForm>({
    name: '',
    invoicePrefix: '',
    currency: 'JPY',
    taxRate: 0.1,
  });
  const [creatingClient, setCreatingClient] = useState(false);

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then((data) => setClients(data as Client[]));
    fetch('/api/bank-accounts').then((r) => r.json()).then((data) => {
      const accs = data as BankAccount[];
      setBankAccounts(accs);
      // 初期値がなければデフォルト口座を自動選択
      if (!initialData?.items) {
        const defaultAcc = accs.find((a) => a.isDefault === 1);
        if (defaultAcc) {
          setForm((prev) => ({ ...prev, bankAccountId: prev.bankAccountId ?? defaultAcc.id }));
        }
      }
    });
  }, []);

  const handleClientChange = (value: string) => {
    if (value === '__new__') {
      setShowNewClient(true);
      return;
    }
    const clientId = parseInt(value);
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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      if (!res.ok) throw new Error('クライアントの作成に失敗しました');
      const created = await res.json() as Client;
      setClients((prev) => [...prev, created]);
      setShowNewClient(false);
      setNewClient({ name: '', invoicePrefix: '', currency: 'JPY', taxRate: 0.1 });
      // 作成したクライアントを自動選択
      const invoiceNumber = generateInvoiceNumber(created.invoicePrefix, form.invoiceDate);
      setForm((prev) => ({
        ...prev,
        clientId: created.id,
        invoiceNumber,
        currency: created.currency,
        items: prev.items.length === 0
          ? [emptyItem(created.currency, created.taxRate)]
          : prev.items,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setCreatingClient(false);
    }
  };

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
      await onSubmit({ ...form, status: 'draft' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
                onChange={(e) => handleClientChange(e.target.value)}
              >
                <option value=''>選択してください</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value='__new__'>＋ 新規クライアントを作成</option>
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
                onChange={(e) => {
                  const newCurrency = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    currency: newCurrency,
                    items: prev.items.map((item) => ({
                      ...item,
                      currency: newCurrency,
                      exchangeRate: newCurrency === 'JPY' ? 1 : item.exchangeRate,
                    })),
                  }));
                }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {form.currency !== 'JPY' && (
                <a
                  href={`https://www.google.com/finance/quote/${form.currency}-JPY`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-brand-600 hover:underline mt-1 inline-block'
                >
                  Google Finance で {form.currency}/JPY を確認 →
                </a>
              )}
            </div>
            {bankAccounts.length > 0 && (
              <div>
                <label className='label'>振込先口座</label>
                <select
                  className='input'
                  value={form.bankAccountId ?? ''}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    bankAccountId: e.target.value ? parseInt(e.target.value) : null,
                  }))}
                >
                  <option value=''>設定から引き継ぐ</option>
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}{a.isDefault === 1 ? ' (デフォルト)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                    <th className='text-left py-2 px-2 text-xs text-gray-500 font-medium w-20'>単位</th>
                    <th className='text-center py-2 px-2 text-xs text-gray-500 font-medium w-24'>通貨</th>
                    {form.items.some((it) => it.currency !== 'JPY') && (
                      <th className='text-right py-2 px-2 text-xs text-gray-500 font-medium w-28'>為替レート</th>
                    )}
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
                          <input
                            className='input text-sm py-1.5 w-20'
                            value={item.unit}
                            onChange={(e) => updateItem(i, 'unit', e.target.value)}
                            placeholder='件'
                            maxLength={20}
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
                        {form.items.some((it) => it.currency !== 'JPY') && (
                          <td className='py-2 px-2'>
                            {isForeign ? (
                              <div>
                                <input
                                  type='number'
                                  className='input text-sm py-1.5 text-right'
                                  value={item.exchangeRate}
                                  onChange={(e) => updateItem(i, 'exchangeRate', parseFloat(e.target.value) || 1)}
                                  step='any'
                                  min={0.0001}
                                />
                                <a
                                  href={`https://www.google.com/finance/quote/${item.currency}-JPY`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-xs text-brand-600 hover:underline mt-0.5 inline-block'
                                >
                                  レート確認 →
                                </a>
                              </div>
                            ) : (
                              <span className='text-xs text-gray-300 px-3'>—</span>
                            )}
                          </td>
                        )}
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
                            className='text-gray-300 hover:text-red-500 transition-colors text-lg leading-none'
                            title='削除'
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

      {/* 新規クライアント作成モーダル */}
      {showNewClient && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl shadow-xl p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>新規クライアントを作成</h3>
            <form onSubmit={handleCreateClient} className='space-y-4'>
              <div>
                <label className='label'>クライアント名 *</label>
                <input
                  className='input'
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient((p) => ({ ...p, name: e.target.value }))}
                  placeholder='株式会社○○'
                />
              </div>
              <div>
                <label className='label'>請求書プレフィックス *</label>
                <input
                  className='input font-mono'
                  required
                  value={newClient.invoicePrefix}
                  onChange={(e) => setNewClient((p) => ({ ...p, invoicePrefix: e.target.value }))}
                  placeholder='CLIENT-'
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='label'>デフォルト通貨</label>
                  <select
                    className='input'
                    value={newClient.currency}
                    onChange={(e) => setNewClient((p) => ({ ...p, currency: e.target.value }))}
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
                    value={newClient.taxRate}
                    onChange={(e) => setNewClient((p) => ({ ...p, taxRate: parseFloat(e.target.value) }))}
                  >
                    <option value={0}>0%</option>
                    <option value={0.08}>8%</option>
                    <option value={0.1}>10%</option>
                  </select>
                </div>
              </div>
              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowNewClient(false)}
                  className='btn-secondary flex-1'
                >
                  キャンセル
                </button>
                <button
                  type='submit'
                  disabled={creatingClient}
                  className='btn-primary flex-1'
                >
                  {creatingClient ? '作成中...' : '作成して選択'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
