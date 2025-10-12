'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useReservation } from '@/contexts/ReservationContext';

export default function ReserveStep2Page() {
  const router = useRouter();
  const {
    selectedPlan,
    selectedDate,
    selectedTime,
    formData: contextFormData,
    setFormData
  } = useReservation();

  const [formData, setLocalFormData] = useState({
    name: contextFormData?.name || '',
    furigana: contextFormData?.furigana || '',
    gender: contextFormData?.gender || '',
    birthdate: contextFormData?.birthdate || '',
    age: contextFormData?.age || '',
    phone: contextFormData?.phone || '',
    email: contextFormData?.email || '',
    address: contextFormData?.address || ''
  });

  const [errors, setErrors] = useState({
    name: '',
    furigana: '',
    gender: '',
    birthdate: '',
    phone: '',
    address: ''
  });

  const [consentChecked, setConsentChecked] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    treatment: false,
    cancellation: false,
    disclaimer: false
  });

  useEffect(() => {
    if (!selectedPlan || !selectedDate || !selectedTime) {
      router.push('/reserve');
    }
  }, [selectedPlan, selectedDate, selectedTime, router]);

  const handleInputChange = (field: string, value: string) => {
    setLocalFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'birthdate' && value) {
      const age = calculateAge(value);
      setLocalFormData(prev => ({ ...prev, birthdate: value, age: age.toString() }));
    }

    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const toggleSection = (section: 'treatment' | 'cancellation' | 'disclaimer') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const validateForm = () => {
    const newErrors = { name: '', furigana: '', gender: '', birthdate: '', phone: '', address: '' };

    if (!formData.name.trim()) newErrors.name = 'お名前を入力してください';

    if (!formData.furigana.trim()) {
      newErrors.furigana = 'フリガナを入力してください';
    } else if (!/^[ァ-ヶー\s]+$/.test(formData.furigana)) {
      newErrors.furigana = 'カタカナで入力してください';
    }

    if (!formData.gender) newErrors.gender = '性別を選択してください';

    if (!formData.birthdate) {
      newErrors.birthdate = '生年月日を入力してください';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '電話番号を入力してください';
    } else if (!/^[0-9\-]+$/.test(formData.phone)) {
      newErrors.phone = '正しい電話番号を入力してください';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'ご住所を入力してください';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleNext = () => {
    if (validateForm() && consentChecked) {
      setFormData(formData);
      router.push('/reserve/step3');
    }
  };

  const handleBack = () => {
    router.push('/reserve');
  };

  const getSelectedDateTime = () => {
    if (selectedDate && selectedTime) {
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

        <h1 className="text-center text-2xl font-bold mb-12">ご予約フォーム</h1>

        {/* ステップ表示 */}
        <div className="flex justify-center items-center mb-12 overflow-x-auto">
          <div className="flex items-center min-w-max">
            <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm">✓</div>
            <div className="text-center ml-1 mr-4"><div className="text-xs font-medium text-gray-600">日時選択</div></div>
            <div className="w-12 h-0.5 bg-gray-600 mx-2"></div>

            <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
            <div className="text-center ml-1 mr-4"><div className="text-xs font-medium">基本情報</div></div>
            <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>

            <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <div className="text-center ml-1 mr-4"><div className="text-xs font-medium text-gray-600">事前問診</div></div>
            <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>

            <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
            <div className="text-center ml-1"><div className="text-xs font-medium text-gray-600">内容確認</div></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              2<span className="text-sm ml-1">/4</span>
            </div>
            <h2 className="text-xl font-bold ml-4">基本情報の入力</h2>
          </div>

          {selectedPlan && selectedDate && selectedTime && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">選択された内容</h3>
              <p className="text-sm text-gray-600">プラン: {selectedPlan.display_name}</p>
              <p className="text-sm text-gray-600">日時: {getSelectedDateTime()}</p>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-base font-semibold mb-4 text-gray-800">基本情報</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="山田太郎"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フリガナ<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input
                type="text"
                value={formData.furigana}
                onChange={(e) => handleInputChange('furigana', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.furigana ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="ヤマダタロウ"
              />
              {errors.furigana && <p className="mt-1 text-sm text-red-600">{errors.furigana}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性別<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="男性"
                    checked={formData.gender === '男性'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">男性</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="女性"
                    checked={formData.gender === '女性'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">女性</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="その他"
                    checked={formData.gender === 'その他'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="mr-2 w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">その他</span>
                </label>
              </div>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生年月日<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
                </label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md ${errors.birthdate ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.birthdate && <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年齢
                </label>
                <input
                  type="text"
                  value={formData.age ? `${formData.age}歳` : ''}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  placeholder="自動計算されます"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ご連絡先電話番号<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="090-1234-5678"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス<span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">※ 予約確認メールを受け取る場合は入力してください</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ご住所<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="東京都渋谷区（市区町村まででも可）"
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              <p className="mt-1 text-xs text-gray-500">※ 市区町村まででも構いません</p>
            </div>
          </div>

          {/* 同意書セクション */}
          <div className="mb-8 border-t pt-8">
            <h3 className="text-lg font-bold mb-4">ご予約にあたっての同意事項</h3>
            <p className="text-sm text-gray-600 mb-6">
              ご予約前に以下の内容をご確認いただき、同意の上でご予約ください。
            </p>

            <div className="border border-gray-300 rounded-lg mb-4">
              <button
                onClick={() => toggleSection('treatment')}
                className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
              >
                <span className="font-semibold text-left">施術に関する同意事項</span>
                {expandedSections.treatment ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.treatment && (
                <div className="px-4 py-4 text-sm text-gray-700 space-y-2 border-t">
                  <p>• 当院の施術は治療行為ではなく、健康増進・体調改善・美容目的のものです</p>
                  <p>• 施術効果には個人差があり、結果を保証するものではありません</p>
                  <p>• 施術中に体調不良・痛み・異常を感じた場合は速やかに申し出てください</p>
                  <p>• 既往症・服薬・妊娠等について虚偽なく申告することに同意します</p>
                  <p>• 施術後の一時的な筋肉痛・発赤・倦怠感などは自然な反応です</p>
                  <p>• 万が一の施術事故については、医療補償保険の範囲で対応します</p>
                </div>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg mb-4">
              <button
                onClick={() => toggleSection('cancellation')}
                className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
              >
                <span className="font-semibold text-left">キャンセルポリシー</span>
                {expandedSections.cancellation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.cancellation && (
                <div className="px-4 py-4 text-sm text-gray-700 space-y-2 border-t">
                  <p>• キャンセル・変更は予約当日を除く2営業日前までにご連絡ください</p>
                  <p>• 当日キャンセル・無断キャンセルは100％のキャンセル料が発生します</p>
                  <p>• 回数券・事前決済の払い戻しは、いかなる理由でも原則不可です</p>
                  <p>• 不可抗力（地震・台風・感染症流行等）による来院困難な場合は、当院判断でキャンセル料を免除する場合があります</p>
                </div>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg mb-6">
              <button
                onClick={() => toggleSection('disclaimer')}
                className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
              >
                <span className="font-semibold text-left">免責事項</span>
                {expandedSections.disclaimer ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {expandedSections.disclaimer && (
                <div className="px-4 py-4 text-sm text-gray-700 space-y-2 border-t">
                  <p>• 施術は医療行為ではなく、疾病の診断・治療を行うものではありません</p>
                  <p>• 施術により発生する筋肉痛・内出血・軽度炎症・倦怠感等は一時的な生理反応です</p>
                  <p>• 重大な事故が発生した場合でも、当院の故意・重過失による場合を除き、損害賠償責任は医療補償保険の範囲内に限定されます</p>
                  <p>• 持病・服薬・既往症・妊娠・体調不良について虚偽・不申告があった場合、当院は一切の責任を負いません</p>
                  <p>• 施術風景・ビフォーアフター写真等は、個人が特定されない形で広告・SNS等に使用される場合があります（拒否希望の場合は事前申し出）</p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-800">
                  上記すべての内容を理解し、同意の上で予約を申し込みます。
                  <span className="block text-xs text-gray-600 mt-1">
                    （送信をもって電子署名・同意とみなします）
                  </span>
                </span>
              </label>
            </div>

            {!consentChecked && (
              <p className="mt-3 text-sm text-red-600 font-medium">
                ※ 同意にチェックを入れないと次へ進めません
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleNext}
              disabled={!consentChecked}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                consentChecked
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              事前問診へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
