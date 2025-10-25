'use client';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    // TODO: NextAuth.jsのsignOut()を実装
    router.push('/admin');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-8 py-4 flex justify-end items-center">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}