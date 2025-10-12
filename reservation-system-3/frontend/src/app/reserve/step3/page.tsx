'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReservation } from '@/contexts/ReservationContext';

export default function ReserveStep3Page() {
  const router = useRouter();
  const {
    selectedPlan,
    selectedDate,
    selectedTime,
    formData: basicFormData,
    questionnaireData: contextQuestionnaireData,
    setQuestionnaireData
  } = useReservation();

  const [formData, setFormData] = useState({
    symptoms: contextQuestionnaireData?.symptoms || '',
    medicalHistory: contextQuestionnaireData?.medicalHistory || '',
    currentMedication: contextQuestionnaireData?.currentMedication || '',
    allergies: contextQuestionnaireData?.allergies || '',
    pregnancy: contextQuestionnaireData?.pregnancy || '',
    otherNotes: contextQuestionnaireData?.otherNotes || ''
  });

  const [errors, setErrors] = useState({
    symptoms: ''
  });

  useEffect(() => {
    if (!selectedPlan || !selectedDate || !selectedTime || !basicFormData?.name) {
      router.push('/reserve');
    }
  }, [selectedPlan, selectedDate, selectedTime, basicFormData, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { symptoms: '' };

    if (!formData.symptoms.trim()) {
      newErrors.symptoms = '現在の症状や気になる部位を入力してください';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleNext = () => {
    if (validateForm()) {
      setQuestionnaireData(formData);
      router.push('/reserve/step4');
    }
  };

  const handleBack = () => {
    router.push('/reserve/step2');
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

        {/* ステップ表示 */}
        <div className="flex justify-center items-center mb-12 overflow-x-auto">
          <div className="flex items-center min-w-max">
            <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm">✓</div>
            <div className="text-center ml-1 mr-4"><div className="text-xs font-medium text-gray-600">日時選択</div></div>
            <div className="w-12 h-0.5 bg-gray-600 mx-2"></div>

            <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm">✓</div>
            <div className="text-center ml-1 mr-4"><div className="text-xs font-medium text-gray-600">基本情報</div></div>
            <div className="w-12 h-0.5 bg-gray-600 mx-2"></div>

            <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <div className="text-center ml-1 mr-4"><div className="text-xs font-medium">事前問診</div></div>
            <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>

            <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
            <div className="text-center ml-1"><div className="text-xs font-medium text-gray-600">内容確認</div></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              3<span className="text-sm ml-1">/4</span>
            </div>
            <h2 className="text-xl font-bold ml-4">事前問診</h2>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              施術を安全に行うため、現在の症状や健康状態について教えてください。<br />
              正確な情報をご記入いただくことで、より効果的な施術をご提供できます。
            </p>
          </div>

          {/* 事前問診フォーム */}
          <div className="mb-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在の症状や気になる部位
                <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => handleInputChange('symptoms', e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border rounded-md ${errors.symptoms ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="例：肩こり、腰痛、頭痛、むくみ、疲れやすい など"
              />
              {errors.symptoms && <p className="mt-1 text-sm text-red-600">{errors.symptoms}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                既往歴（過去の病気や怪我）
                <span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：ヘルニア、骨折、高血圧、糖尿病 など（ない場合は「特になし」とご記入ください）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在服用中の薬
                <span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <textarea
                value={formData.currentMedication}
                onChange={(e) => handleInputChange('currentMedication', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：降圧剤、鎮痛剤、サプリメント など（ない場合は「特になし」とご記入ください）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アレルギーの有無
                <span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <textarea
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：食物アレルギー、薬物アレルギー、金属アレルギー など（ない場合は「特になし」とご記入ください）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                妊娠の有無（該当する方のみ）
                <span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pregnancy"
                    value="妊娠していない"
                    checked={formData.pregnancy === '妊娠していない'}
                    onChange={(e) => handleInputChange('pregnancy', e.target.value)}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">妊娠していない</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pregnancy"
                    value="妊娠中"
                    checked={formData.pregnancy === '妊娠中'}
                    onChange={(e) => handleInputChange('pregnancy', e.target.value)}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">妊娠中</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pregnancy"
                    value="妊娠の可能性がある"
                    checked={formData.pregnancy === '妊娠の可能性がある'}
                    onChange={(e) => handleInputChange('pregnancy', e.target.value)}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">妊娠の可能性がある</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                その他ご要望・お伝えしたいこと
                <span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <textarea
                value={formData.otherNotes}
                onChange={(e) => handleInputChange('otherNotes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="施術に関するご要望や、事前にお伝えしておきたいことがあればご記入ください"
              />
            </div>
          </div>

          {/* 注意事項 */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">重要なお知らせ</p>
                <p>
                  急性の痛みや症状がある場合、まずは医療機関を受診されることをお勧めします。
                  当院での施術は医療行為ではなく、健康増進・体調改善を目的としたものです。
                </p>
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              ご予約内容の確認へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}