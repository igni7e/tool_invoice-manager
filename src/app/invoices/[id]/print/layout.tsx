export const runtime = 'edge';

// 印刷ページはサイドバーなし・全幅レイアウト
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
