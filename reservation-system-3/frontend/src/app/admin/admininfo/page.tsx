'use client';

import React, { useState } from 'react';
import { Admin } from '@/lib/types/admin';

const initialAdmins: Admin[] = [
  {
    id: 1,
    loginId: 'hari.shinjuku@gmail.com',
    isActive: true,
    role: 'admin',
  },
  {
    id: 2,
    loginId: 'nana.21671907102000@icloud.com',
    isActive: true,
    role: 'admin',
  },
];

export default function AdminInfoListPage() {
  const [admins] = useState<Admin[]>(initialAdmins);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">管理者一覧</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                ログインID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                権限
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                状態
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{admin.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{admin.loginId}</td>
                <td className="px-6 py-4 text-sm">
                  {admin.role === 'admin' ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                      ADMIN
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">
                      MEMBER
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {admin.isActive ? '有効' : '無効'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {admins.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-500">
          登録されている管理者がいません
        </div>
      )}
    </div>
  );
}