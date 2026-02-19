'use client';
export const runtime = 'edge';
import { useState, useEffect } from 'react';

interface Settings {
  companyName?: string;
  companyAddress?: string;
  companyAddressEn?: string;
  bankName?: string;
  bankBranch?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountHolderEn?: string;
  taxRegistrationNumber?: string;
  bankCode?: string;
  swiftCode?: string;
  bankNameEn?: string;
  bankBranchEn?: string;
}

interface BankAccount {
  id: number;
  label: string;
  bankName?: string;
  bankBranch?: string;
  bankNameEn?: string;
  bankBranchEn?: string;
  accountType?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountHolderEn?: string;
  bankCode?: string;
  swiftCode?: string;
  isDefault?: number;
  sortOrder?: number;
}

const emptyBankAccount: Omit<BankAccount, 'id'> = {
  label: '',
  bankName: '',
  bankBranch: '',
  bankNameEn: '',
  bankBranchEn: '',
  accountType: '普通',
  accountNumber: '',
  accountHolder: '',
  accountHolderEn: '',
  bankCode: '',
  swiftCode: '',
  isDefault: 0,
  sortOrder: 0,
};

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({
    accountType: '普通',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // 銀行口座管理
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<BankAccount> & { label: string }>(
    { ...emptyBankAccount }
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then((r) => r.json()),
      fetch('/api/bank-accounts').then((r) => r.json()),
    ]).then(([settings, bankAccounts]) => {
      setForm((prev) => ({ ...prev, ...(settings as Settings) }));
      setAccounts(bankAccounts as BankAccount[]);
    });
  }, []);

  const set = (key: keyof Settings, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setEditingAccount({ ...emptyBankAccount });
    setShowModal(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingId(account.id);
    setEditingAccount({ ...account });
    setShowModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSaving(true);
    try {
      const url = editingId
        ? `/api/bank-accounts/${editingId}`
        : '/api/bank-accounts';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAccount),
      });
      if (!res.ok) throw new Error('保存に失敗しました');
      const saved = await res.json() as BankAccount;

      if (editingId) {
        setAccounts((prev) =>
          prev.map((a) => {
            if (a.id === editingId) return saved;
            // デフォルト変更時、他のデフォルトを解除
            if (saved.isDefault === 1 && a.isDefault === 1) return { ...a, isDefault: 0 };
            return a;
          })
        );
      } else {
        setAccounts((prev) => {
          if (saved.isDefault === 1) {
            return [...prev.map((a) => ({ ...a, isDefault: 0 })), saved];
          }
          return [...prev, saved];
        });
      }
      setShowModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setAccountSaving(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('この口座を削除しますか？')) return;
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const setAcc = (key: string, value: string | number) =>
    setEditingAccount((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>設定</h1>
        <p className='text-sm text-gray-500 mt-1'>会社情報・銀行情報・インボイス登録番号を管理します</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6 max-w-2xl'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
            {error}
          </div>
        )}
        {saved && (
          <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm'>
            設定を保存しました
          </div>
        )}

        {/* 会社情報 */}
        <div className='card'>
          <h2 className='text-sm font-semibold text-gray-700 mb-4'>会社情報</h2>
          <div className='space-y-4'>
            <div>
              <label className='label'>会社名</label>
              <input
                className='input'
                value={form.companyName ?? ''}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder='株式会社IGNITE'
              />
            </div>
            <div>
              <label className='label'>住所（日本語）</label>
              <textarea
                className='input h-20 resize-none'
                value={form.companyAddress ?? ''}
                onChange={(e) => set('companyAddress', e.target.value)}
                placeholder='〒530-0001 大阪府大阪市北区...'
              />
            </div>
            <div>
              <label className='label'>住所（英語）</label>
              <textarea
                className='input h-20 resize-none'
                value={form.companyAddressEn ?? ''}
                onChange={(e) => set('companyAddressEn', e.target.value)}
                placeholder='530-0001 Osaka, Japan'
              />
            </div>
          </div>
        </div>

        {/* インボイス登録番号 */}
        <div className='card'>
          <h2 className='text-sm font-semibold text-gray-700 mb-4'>インボイス制度（適格請求書）</h2>
          <div>
            <label className='label'>登録番号（T + 13桁）</label>
            <input
              className='input font-mono'
              value={form.taxRegistrationNumber ?? ''}
              onChange={(e) => set('taxRegistrationNumber', e.target.value)}
              placeholder='T1234567890123'
              maxLength={14}
            />
            <p className='text-xs text-gray-400 mt-1'>
              国税庁の適格請求書発行事業者登録番号を入力してください
            </p>
          </div>
        </div>

        {/* 既存の銀行情報（後方互換） */}
        <div className='card'>
          <h2 className='text-sm font-semibold text-gray-700 mb-4'>振込先銀行情報（デフォルト）</h2>
          <p className='text-xs text-gray-400 mb-4'>
            口座を個別に管理する場合は、下の「振込先口座（複数管理）」をご利用ください
          </p>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='label'>銀行名</label>
              <input
                className='input'
                value={form.bankName ?? ''}
                onChange={(e) => set('bankName', e.target.value)}
                placeholder='三井住友銀行'
              />
            </div>
            <div>
              <label className='label'>支店名</label>
              <input
                className='input'
                value={form.bankBranch ?? ''}
                onChange={(e) => set('bankBranch', e.target.value)}
                placeholder='梅田支店'
              />
            </div>
            <div>
              <label className='label'>口座種別</label>
              <select
                className='input'
                value={form.accountType ?? '普通'}
                onChange={(e) => set('accountType', e.target.value)}
              >
                <option value='普通'>普通</option>
                <option value='当座'>当座</option>
              </select>
            </div>
            <div>
              <label className='label'>口座番号</label>
              <input
                className='input font-mono'
                value={form.accountNumber ?? ''}
                onChange={(e) => set('accountNumber', e.target.value)}
                placeholder='1234567'
              />
            </div>
            <div>
              <label className='label'>口座名義（日本語）</label>
              <input
                className='input'
                value={form.accountHolder ?? ''}
                onChange={(e) => set('accountHolder', e.target.value)}
                placeholder='（有）イグナイト'
              />
            </div>
            <div>
              <label className='label'>口座名義（英語）</label>
              <input
                className='input'
                value={form.accountHolderEn ?? ''}
                onChange={(e) => set('accountHolderEn', e.target.value)}
                placeholder='Ignite LLC'
              />
            </div>
            <div>
              <label className='label'>銀行コード（支店番号）</label>
              <input
                className='input font-mono'
                value={form.bankCode ?? ''}
                onChange={(e) => set('bankCode', e.target.value)}
                placeholder='0009'
                maxLength={10}
              />
            </div>
            <div>
              <label className='label'>SWIFT/BIC コード</label>
              <input
                className='input font-mono'
                value={form.swiftCode ?? ''}
                onChange={(e) => set('swiftCode', e.target.value)}
                placeholder='SMBCJPJT'
                maxLength={20}
              />
            </div>
            <div>
              <label className='label'>銀行名（英語）</label>
              <input
                className='input'
                value={form.bankNameEn ?? ''}
                onChange={(e) => set('bankNameEn', e.target.value)}
                placeholder='Sumitomo Mitsui Banking Corporation'
              />
            </div>
            <div>
              <label className='label'>支店名（英語）</label>
              <input
                className='input'
                value={form.bankBranchEn ?? ''}
                onChange={(e) => set('bankBranchEn', e.target.value)}
                placeholder='Umeda Branch'
              />
            </div>
          </div>
        </div>

        <div className='flex justify-end'>
          <button type='submit' disabled={saving} className='btn-primary'>
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </form>

      {/* 振込先口座（複数管理） */}
      <div className='max-w-2xl mt-8'>
        <div className='card'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h2 className='text-sm font-semibold text-gray-700'>振込先口座（複数管理）</h2>
              <p className='text-xs text-gray-400 mt-1'>
                請求書ごとに異なる振込先を選択できます
              </p>
            </div>
            <button
              type='button'
              onClick={openAddModal}
              className='btn-primary text-sm py-1.5'
            >
              + 口座を追加
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className='text-sm text-gray-400 text-center py-6'>
              口座が登録されていません
            </p>
          ) : (
            <div className='divide-y divide-gray-100'>
              {accounts.map((account) => (
                <div key={account.id} className='flex items-center justify-between py-3'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm text-gray-900'>{account.label}</span>
                      {account.isDefault === 1 && (
                        <span className='text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium'>
                          デフォルト
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-gray-500 mt-0.5'>
                      {account.bankName} {account.bankBranch} / {account.accountType} {account.accountNumber}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <button
                      type='button'
                      onClick={() => openEditModal(account)}
                      className='text-xs text-gray-500 hover:text-gray-700'
                    >
                      編集
                    </button>
                    <button
                      type='button'
                      onClick={() => handleDeleteAccount(account.id)}
                      className='text-xs text-red-400 hover:text-red-600'
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 口座追加/編集モーダル */}
      {showModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              {editingId ? '口座を編集' : '口座を追加'}
            </h3>
            <form onSubmit={handleSaveAccount} className='space-y-4'>
              <div>
                <label className='label'>ラベル *</label>
                <input
                  className='input'
                  required
                  value={editingAccount.label}
                  onChange={(e) => setAcc('label', e.target.value)}
                  placeholder='三井住友 梅田'
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='label'>銀行名</label>
                  <input
                    className='input'
                    value={editingAccount.bankName ?? ''}
                    onChange={(e) => setAcc('bankName', e.target.value)}
                    placeholder='三井住友銀行'
                  />
                </div>
                <div>
                  <label className='label'>支店名</label>
                  <input
                    className='input'
                    value={editingAccount.bankBranch ?? ''}
                    onChange={(e) => setAcc('bankBranch', e.target.value)}
                    placeholder='梅田支店'
                  />
                </div>
                <div>
                  <label className='label'>口座種別</label>
                  <select
                    className='input'
                    value={editingAccount.accountType ?? '普通'}
                    onChange={(e) => setAcc('accountType', e.target.value)}
                  >
                    <option value='普通'>普通</option>
                    <option value='当座'>当座</option>
                  </select>
                </div>
                <div>
                  <label className='label'>口座番号</label>
                  <input
                    className='input font-mono'
                    value={editingAccount.accountNumber ?? ''}
                    onChange={(e) => setAcc('accountNumber', e.target.value)}
                    placeholder='1234567'
                  />
                </div>
                <div>
                  <label className='label'>口座名義（日本語）</label>
                  <input
                    className='input'
                    value={editingAccount.accountHolder ?? ''}
                    onChange={(e) => setAcc('accountHolder', e.target.value)}
                    placeholder='（有）イグナイト'
                  />
                </div>
                <div>
                  <label className='label'>口座名義（英語）</label>
                  <input
                    className='input'
                    value={editingAccount.accountHolderEn ?? ''}
                    onChange={(e) => setAcc('accountHolderEn', e.target.value)}
                    placeholder='Ignite LLC'
                  />
                </div>
                <div>
                  <label className='label'>銀行名（英語）</label>
                  <input
                    className='input'
                    value={editingAccount.bankNameEn ?? ''}
                    onChange={(e) => setAcc('bankNameEn', e.target.value)}
                    placeholder='Sumitomo Mitsui Banking Corporation'
                  />
                </div>
                <div>
                  <label className='label'>支店名（英語）</label>
                  <input
                    className='input'
                    value={editingAccount.bankBranchEn ?? ''}
                    onChange={(e) => setAcc('bankBranchEn', e.target.value)}
                    placeholder='Umeda Branch'
                  />
                </div>
                <div>
                  <label className='label'>銀行コード</label>
                  <input
                    className='input font-mono'
                    value={editingAccount.bankCode ?? ''}
                    onChange={(e) => setAcc('bankCode', e.target.value)}
                    placeholder='0009'
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className='label'>SWIFT/BIC コード</label>
                  <input
                    className='input font-mono'
                    value={editingAccount.swiftCode ?? ''}
                    onChange={(e) => setAcc('swiftCode', e.target.value)}
                    placeholder='SMBCJPJT'
                    maxLength={20}
                  />
                </div>
              </div>
              <label className='flex items-center gap-2 text-sm text-gray-700'>
                <input
                  type='checkbox'
                  checked={editingAccount.isDefault === 1}
                  onChange={(e) => setAcc('isDefault', e.target.checked ? 1 : 0)}
                  className='rounded border-gray-300'
                />
                デフォルト口座に設定
              </label>
              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='btn-secondary flex-1'
                >
                  キャンセル
                </button>
                <button
                  type='submit'
                  disabled={accountSaving}
                  className='btn-primary flex-1'
                >
                  {accountSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
