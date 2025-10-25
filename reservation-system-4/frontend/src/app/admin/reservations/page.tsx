'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Reservation = {
  id: string;
  reservation_number: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled';
  customer_name: string;
  customer_furigana: string;
  customer_gender: string;
  customer_birthdate: string;
  customer_age: number;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  plan_name: string;
  questionnaire_symptoms: string;
  questionnaire_medical_history: string;
  questionnaire_current_medication: string;
  questionnaire_allergies: string;
  questionnaire_pregnancy: string;
  questionnaire_other_notes: string;
};

export default function AdminReservationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 仮認証: ログインID/PWをlocalStorageで判定
  useEffect(() => {
    const loginId = localStorage.getItem('admin_login_id');
    const password = localStorage.getItem('admin_password');
    if (loginId !== 'hari.shinjuku@gmail.com' || password !== 'hari0801') {
      router.push('/admin');
    }
  }, [router]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/reservations');
      const data = await response.json();

      if (data.success) {
        setReservations(data.data.reservations);
      } else {
        alert('予約データの取得に失敗しました');
      }
    } catch (error) {
      console.error('予約取得エラー:', error);
      alert('予約データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/admin');
  };

  const getStatusBadge = (status: string) => {
    return status === 'confirmed'
      ? <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">確定</span>
      : <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">キャンセル</span>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return `${year}/${month}/${day} (${dayOfWeek})`;
  };

  const filteredReservations = reservations.filter(reservation =>
    reservation.customer_name.includes(searchQuery) ||
    reservation.customer_phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-900">データを読み込んでいます...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">予約管理</h1>
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-900 hover:text-gray-700">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <input
            type="text"
            placeholder="お名前・電話番号で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">予約一覧 ({filteredReservations.length}件)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">予約番号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">お客様情報</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">プラン</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <React.Fragment key={reservation.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === reservation.id ? null : reservation.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{reservation.reservation_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatDate(reservation.reservation_date)}</div>
                        <div className="text-sm text-gray-500">{reservation.start_time} - {reservation.end_time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{reservation.customer_name}</div>
                        <div className="text-sm text-gray-500">{reservation.customer_phone}</div>
                        <div className="text-sm text-gray-500">{reservation.customer_email || '未入力'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{reservation.plan_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(reservation.status)}
                      </td>
                    </tr>
                    {expandedId === reservation.id && (
                      <tr key={`${reservation.id}-details`}>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* 顧客詳細情報 */}
                            <div className="border-b pb-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">顧客情報</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">お名前:</span>
                                  <span className="ml-2 text-gray-900">{reservation.customer_name}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">フリガナ:</span>
                                  <span className="ml-2 text-gray-900">{reservation.customer_furigana || '未入力'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">性別:</span>
                                  <span className="ml-2 text-gray-900">{reservation.customer_gender || '未入力'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">生年月日・年齢:</span>
                                  <span className="ml-2 text-gray-900">
                                    {reservation.customer_birthdate
                                      ? `${new Date(reservation.customer_birthdate).toLocaleDateString('ja-JP')} (${reservation.customer_age}歳)`
                                      : '未入力'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">電話番号:</span>
                                  <span className="ml-2 text-gray-900">{reservation.customer_phone}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">メールアドレス:</span>
                                  <span className="ml-2 text-gray-900">{reservation.customer_email || '未入力'}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-600">ご住所:</span>
                                  <span className="ml-2 text-gray-900">{reservation.customer_address || '未入力'}</span>
                                </div>
                              </div>
                            </div>

                            {/* 事前問診情報 */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">事前問診</h4>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <span className="text-gray-600 font-medium">現在の症状・気になる部位:</span>
                                  <p className="mt-1 text-gray-900 whitespace-pre-wrap bg-white p-2 rounded">
                                    {reservation.questionnaire_symptoms || '未入力'}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-gray-600 font-medium">既往歴:</span>
                                    <p className="mt-1 text-gray-900 bg-white p-2 rounded">
                                      {reservation.questionnaire_medical_history || '未入力'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 font-medium">服用中の薬:</span>
                                    <p className="mt-1 text-gray-900 bg-white p-2 rounded">
                                      {reservation.questionnaire_current_medication || '未入力'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 font-medium">アレルギー:</span>
                                    <p className="mt-1 text-gray-900 bg-white p-2 rounded">
                                      {reservation.questionnaire_allergies || '未入力'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 font-medium">妊娠の有無:</span>
                                    <p className="mt-1 text-gray-900 bg-white p-2 rounded">
                                      {reservation.questionnaire_pregnancy || '未回答'}
                                    </p>
                                  </div>
                                </div>
                                {reservation.questionnaire_other_notes && (
                                  <div>
                                    <span className="text-gray-600 font-medium">その他ご要望:</span>
                                    <p className="mt-1 text-gray-900 whitespace-pre-wrap bg-white p-2 rounded">
                                      {reservation.questionnaire_other_notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {filteredReservations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">予約がありません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}