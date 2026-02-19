export default function DashboardPage() {
  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-900 mb-6'>ダッシュボード</h1>
      <div className='grid grid-cols-3 gap-6 mb-8'>
        <StatCard label='今月の請求総額' value='¥0' sub='0件' />
        <StatCard label='未払い請求書' value='0件' sub='¥0' />
        <StatCard label='クライアント数' value='0社' sub='' />
      </div>
      <div className='card'>
        <h2 className='text-lg font-semibold mb-4'>最近の請求書</h2>
        <p className='text-sm text-gray-500'>請求書がありません</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className='card'>
      <p className='text-sm text-gray-500 mb-1'>{label}</p>
      <p className='text-2xl font-bold text-gray-900'>{value}</p>
      {sub && <p className='text-sm text-gray-400 mt-1'>{sub}</p>}
    </div>
  );
}
