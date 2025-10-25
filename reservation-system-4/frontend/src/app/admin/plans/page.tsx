'use client';

import React, { useState, useEffect } from 'react';
import { apiClient, Plan } from '@/lib/api';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      } else {
        setError('プランの取得に失敗しました');
      }
    } catch (err) {
      setError('プランの取得に失敗しました');
      console.error('プラン取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">プラン一覧</h1>
      </div>

      <div className="p-6">
        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            登録されているプランがありません
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {plan.display_name}
                    </h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex gap-6 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">料金:</span>{' '}
                        {plan.price ? `¥${plan.price.toLocaleString()}` : '料金未設定'}
                      </div>
                      <div>
                        <span className="font-medium">所要時間:</span> {plan.duration}分
                      </div>
                      <div>
                        <span className="font-medium">状態:</span>{' '}
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            plan.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {plan.is_active ? '有効' : '無効'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}