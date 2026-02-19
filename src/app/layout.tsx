import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Invoice Manager | IGNITE',
  description: '請求書管理システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ja'>
      <body className={inter.className}>
        <div className='min-h-screen flex'>
          <Sidebar />
          <main className='flex-1 p-8'>{children}</main>
        </div>
      </body>
    </html>
  );
}

function Sidebar() {
  return (
    <aside className='w-60 bg-gray-900 text-white flex flex-col min-h-screen'>
      <div className='px-6 py-5 border-b border-gray-700'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center text-white font-bold text-sm'>
            I
          </div>
          <span className='font-semibold text-sm'>Invoice Manager</span>
        </div>
      </div>
      <nav className='flex-1 px-3 py-4 space-y-1'>
        <NavItem href='/' label='ダッシュボード' icon='📊' />
        <NavItem href='/invoices' label='請求書' icon='📄' />
        <NavItem href='/clients' label='クライアント' icon='👥' />
      </nav>
      <div className='px-6 py-4 border-t border-gray-700 text-xs text-gray-500'>
        IGNITE © 2026
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors'
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}
