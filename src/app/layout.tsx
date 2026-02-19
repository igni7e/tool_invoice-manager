import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

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
          <main className='flex-1 p-8 min-w-0'>{children}</main>
        </div>
      </body>
    </html>
  );
}

