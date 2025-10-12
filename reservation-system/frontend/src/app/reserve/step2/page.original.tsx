'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReserveStep2Page() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    requests: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { name: '', phone: '', email: '' };
    if (!formData.name.trim()) newErrors.name = 'お名前を入力してください';
    if (!formData.phone.trim()) newErrors.phone = '電話番号を入力してください';
    else if (!/^[0-9\-]+$/.test(formData.phone)) newErrors.phone = '正しい電話番号を入力してください';
    if (!formData.email.trim()) newErrors.email = 'メールアドレスを入力してください';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = '正しいメールアドレスを入力してください';
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleNext = () => {
    if (validateForm()) router.push('/reserve/step3');
  };

  const handleBack = () => {
    router.push('/reserve');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-32 h-16 mx-auto bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-600 text-sm">LOGO</span>
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold mb-12">ご予約フォーム</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              2<span className="text-sm ml-1">/3</span>
            </div>
            <h2 className="text-xl font-bold ml-4">お客様情報の入力</h2>
          </div>
          <div className="mb-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="山田太郎" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電話番号<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="00000000000" />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="hari@sample.com" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ご要望<span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <textarea value={formData.requests} onChange={(e) => handleInputChange('requests', e.target.value)} rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="特に気になる部位や症状、痛み、お悩みなどがあればご記入ください" />
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={handleBack} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              最初からやり直す
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