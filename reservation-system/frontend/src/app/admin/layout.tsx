'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // ログイン画面の場合はレイアウトを適用しない
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <AdminSidebar />
      
      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <AdminHeader />
        
        {/* コンテンツ */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}