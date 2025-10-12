'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReservation } from '@/contexts/ReservationContext';
import { apiClient } from '@/lib/api';

export default function ReserveStep3Page() {
  const router = useRouter();
  const {
    selectedPlan,
    selectedDate,
    selectedTime,
    formData,
    getCompleteFormData,
    resetReservation
  } = useReservation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 前のステップで必要なデータが選択されていない場合はリダイレクト
  useEffect(() => {
    if (!selectedPlan || !selectedDate || !selectedTime || !formData.name || !formData.email || !formData.phone) {
      router.push('/reserve');
    }
  }, [selectedPlan, selectedDate, selectedTime, formData, router]);

  const handleSubmit = async () => {
    const completeFormData = getCompleteFormData();
    if (!completeFormData) {
      setError('必要な情報が不足しています');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.createReservation(completeFormData);

      if (response.success && response.data?.reservationNumber) {
        // 予約成功 - 完了ページにリダイレクト
        router.push(`/reserve/complete?reservationNumber=${response.data.reservationNumber}`);
      } else {
        setError(response.message || '予約の作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/reserve/step2');
  };

  const handleRestart = () => {
    resetReservation();
    router.push('/reserve');
  };

  // 選択された日時の表示用
  const getSelectedDateTime = () => {
    if (selectedDate && selectedTime) {
      // selectedDateは "M/D" 形式なので、現在の年を付けて日付を作る
      const [month, day] = selectedDate.split('/');
      const year = new Date().getFullYear();
      const date = new Date(year, parseInt(month) - 1, parseInt(day));
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

      return `${year}年${month}月${day}日(${dayOfWeek}) ${selectedTime}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">予約を作成中...</h2>
          <p className="text-gray-800">しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        <div className="text-center mb-8">
          <div className="w-32 h-16 mx-auto bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-800 text-sm">LOGO</span>
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold mb-12 text-gray-900">ご予約フォーム</h1>

        <div className="flex justify-center items-center mb-12">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <div className="text-center ml-2 mr-8"><div className="text-sm font-medium text-gray-800">日時を選ぶ</div></div>
            <div className="w-16 h-0.5 bg-gray-600 mx-4"></div>
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <div className="text-center ml-2 mr-8"><div className="text-sm font-medium text-gray-800">お客様情報の入力</div></div>
            <div className="w-16 h-0.5 bg-gray-600 mx-4"></div>
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div className="text-center ml-2"><div className="text-sm font-medium text-gray-800">ご予約内容の確認</div></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">

          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-800">
              3<span className="text-sm ml-1">/3</span>
            </div>
            <h2 className="text-xl font-bold ml-4 text-gray-900">ご予約内容の確認</h2>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">プラン</h3>
              <p className="text-gray-800">{selectedPlan?.display_name}</p>
              {selectedPlan?.price && (
                <p className="text-sm text-gray-700">料金: ¥{selectedPlan.price.toLocaleString()}</p>
              )}
              {selectedPlan?.description && (
                <p className="text-sm text-gray-700 mt-2">{selectedPlan.description}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">日時</h3>
              <p className="text-gray-800">{getSelectedDateTime()}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">お名前</h3>
              <p className="text-gray-800">{formData.name}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">電話番号</h3>
              <p className="text-gray-800">{formData.phone}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">メールアドレス</h3>
              <p className="text-gray-800">{formData.email}</p>
            </div>

            {formData.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">ご要望</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{formData.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="flex gap-3">
              <button onClick={handleBack} className="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                戻る
              </button>
              <button onClick={handleRestart} className="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                最初からやり直す
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '予約中...' : '予約する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}