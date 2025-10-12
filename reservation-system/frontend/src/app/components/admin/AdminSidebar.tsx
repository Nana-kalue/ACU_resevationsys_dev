'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    title: '予約管理',
    items: [
      { name: '予約一覧', href: '/admin/reservations' },
      { name: '予約登録', href: '/admin/reservations/new' },
      { name: '予約受付停止設定', href: '/admin/reservations/suspend' }
    ]
  },
  {
    title: 'プラン管理',
    items: [
      { name: 'プラン一覧', href: '/admin/plans' }
    ]
  },
  {
    title: '管理者情報',
    items: [
      { name: '一覧', href: '/admin/admininfo' },
    ]
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* ロゴエリア */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin/reservations" className="text-xl font-bold text-gray-800">
          予約管理
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-4 space-y-8">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-sm font-semibold text-gray-900 mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        block px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-gray-100 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}