'use client';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function InvoicePagination({ page, totalPages, total, pageSize, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const showAllPages = totalPages <= 7;

  return (
    <div className='flex items-center justify-between px-4 py-3 border-t border-gray-200'>
      <p className='text-sm text-gray-500'>
        {from}–{to}件 / 全{total}件
      </p>
      <div className='flex items-center gap-1'>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className='px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
        >
          ← 前へ
        </button>

        {showAllPages
          ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 text-sm rounded ${
                  p === page
                    ? 'bg-brand-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {p}
              </button>
            ))
          : (
            <span className='text-sm text-gray-600 px-2'>
              {page} / {totalPages}
            </span>
          )
        }

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className='px-2 py-1 text-sm rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
        >
          次へ →
        </button>
      </div>
    </div>
  );
}
