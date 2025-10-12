'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReservation } from '@/contexts/ReservationContext';

export default function ReserveStep2Page() {
  const router = useRouter();
  const {
    selectedPlan,
    selectedDate,
    selectedTime,
    formData,
    setFormData
  } = useReservation();

  const [localFormData, setLocalFormData] = useState({
    name: formData.name || '',
    phone: formData.phone || '',
    email: formData.email || '',
    notes: formData.notes || ''
  });

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // 前のステップで必要なデータが選択されていない場合はリダイレクト
  useEffect(() => {
    if (!selectedPlan || !selectedDate || !selectedTime) {
      router.push('/reserve');
    }
  }, [selectedPlan, selectedDate, selectedTime, router]);

  const handleInputChange = (field: string, value: string) => {
    setLocalFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { name: '', phone: '', email: '' };
    if (!localFormData.name.trim()) newErrors.name = 'お名前を入力してください';
    if (!localFormData.phone.trim()) newErrors.phone = '電話番号を入力してください';
    else if (!/^[0-9\-+\(\)\s]+$/.test(localFormData.phone)) newErrors.phone = '正しい電話番号を入力してください';
    if (!localFormData.email.trim()) newErrors.email = 'メールアドレスを入力してください';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localFormData.email)) newErrors.email = '正しいメールアドレスを入力してください';
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleNext = () => {
    if (validateForm()) {
      // フォームデータを保存
      setFormData({
        name: localFormData.name,
        phone: localFormData.phone,
        email: localFormData.email,
        notes: localFormData.notes
      });
      router.push('/reserve/step3');
    }
  };

  const handleBack = () => {
    router.push('/reserve');
  };

  // 選択された日時の表示用
  const getSelectedDateTime = () => {
    if (selectedDate && selectedTime && selectedPlan) {
      // selectedDateは "M/D" 形式なので、現在の年を付けて日付を作る
      const [month, day] = selectedDate.split('/');
      const year = new Date().getFullYear();
      const date = new Date(year, parseInt(month) - 1, parseInt(day));
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

      return `${year}年${month}月${day}日(${dayOfWeek}) ${selectedTime}`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-32 h-16 mx-auto bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-600 text-sm">LOGO</span>
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold mb-12 text-gray-900">ご予約フォーム</h1>

        {/* ステップ表示 */}
        <div className="flex justify-center items-center mb-12">
          <div className="flex items-center">
            {/* Step 1 */}
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">
              ✓
            </div>
            <div className="text-center ml-2 mr-8">
              <div className="text-sm font-medium text-gray-800">日時を選ぶ</div>
            </div>

            {/* 線 */}
            <div className="w-16 h-0.5 bg-gray-600 mx-4"></div>

            {/* Step 2 */}
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="text-center ml-2 mr-8">
              <div className="text-sm font-medium text-gray-800">お客様情報の入力</div>
            </div>

            {/* 線 */}
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>

            {/* Step 3 */}
            <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="text-center ml-2">
              <div className="text-sm font-medium text-gray-800">ご予約内容の確認</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              2<span className="text-sm ml-1">/3</span>
            </div>
            <h2 className="text-xl font-bold ml-4 text-gray-900">お客様情報の入力</h2>
          </div>

          {/* 選択された内容の確認表示 */}
          {selectedPlan && selectedDate && selectedTime && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">選択された内容</h3>
              <p className="text-sm text-gray-600">プラン: {selectedPlan.display_name}</p>
              <p className="text-sm text-gray-600">日時: {getSelectedDateTime()}</p>
            </div>
          )}

          <div className="mb-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                お名前<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input type="text" value={localFormData.name} onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md text-gray-900 placeholder-gray-400 ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="山田太郎" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                電話番号<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input type="tel" value={localFormData.phone} onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md text-gray-900 placeholder-gray-400 ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="090-1234-5678" />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                メールアドレス<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input type="email" value={localFormData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md text-gray-900 placeholder-gray-400 ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="example@email.com" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                ご要望<span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <textarea value={localFormData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="特に気になる部位や症状、痛み、お悩みなどがあればご記入ください" />
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={handleBack} className="px-6 py-3 border border-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              戻る
            </button>
            <button onClick={handleNext} className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              ご予約内容の確認へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}