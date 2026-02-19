'use client';
import { usePathname } from 'next/navigation';

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-brand-600 text-white font-medium'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  if (pathname.endsWith('/print')) return null;

  return (
    <aside className='w-60 bg-gray-900 text-white flex flex-col min-h-screen shrink-0'>
      <div className='px-6 py-5 border-b border-gray-700'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center text-white font-bold text-sm'>
            I
          </div>
          <span className='font-semibold text-sm'>Invoice Manager</span>
        </div>
      </div>
      <nav className='flex-1 px-3 py-4 space-y-1'>
        <a
          href='/invoices/new'
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-3 ${
            pathname === '/invoices/new'
              ? 'bg-brand-600 text-white'
              : 'bg-brand-600/10 text-brand-400 hover:bg-brand-600/20'
          }`}
        >
          <span>＋</span>
          <span>新規作成</span>
        </a>
        <NavItem href='/' label='ダッシュボード' icon='📊' active={pathname === '/'} />
        <NavItem href='/invoices' label='請求書' icon='📄' active={pathname.startsWith('/invoices') && pathname !== '/invoices/new'} />
        <NavItem href='/clients' label='クライアント' icon='👥' active={pathname.startsWith('/clients')} />
        <NavItem href='/settings' label='設定' icon='⚙️' active={pathname.startsWith('/settings')} />
      </nav>
      <div className='px-6 py-4 border-t border-gray-700 text-xs text-gray-500'>
        IGNITE © 2026
      </div>
    </aside>
  );
}
