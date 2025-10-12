'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ReserveStep2Page() {
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const [consentChecked, setConsentChecked] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    treatment: false,
    cancellation: false,
    disclaimer: false
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleSection = (section: 'treatment' | 'cancellation' | 'disclaimer') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
    if (validateForm() && consentChecked) {
      // 実際の実装では router.push('/reserve/step3') を使用
      alert('フォームが送信されました！次のステップへ進みます。');
      console.log('Form data:', formData);
    }
  };

  const handleBack = () => {
    // 実際の実装では router.push('/reserve') を使用
    alert('前のステップに戻ります');
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
        <div className="flex justify-center items-center mb-12">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <div className="text-center ml-2 mr-8"><div className="text-sm font-medium text-gray-600">日時を選ぶ</div></div>
            <div className="w-16 h-0.5 bg-gray-600 mx-4"></div>
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
            <div className="text-center ml-2 mr-8"><div className="text-sm font-medium">お客様情報の入力</div></div>
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
            <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div className="text-center ml-2"><div className="text-sm font-medium text-gray-600">ご予約内容の確認</div></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              2<span className="text-sm ml-1">/3</span>
            </div>
            <h2 className="text-xl font-bold ml-4">お客様情報の入力</h2>
          </div>

          {/* お客様情報入力フォーム */}
          <div className="mb-8">
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
                電話番号<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
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
                メールアドレス<span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded">必須</span>
              </label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="example@email.com" 
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ご要望<span className="ml-2 px-2 py-1 bg-gray-400 text-white text-xs rounded">任意</span>
              </label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => handleInputChange('notes', e.target.value)} 
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="特に気になる部位や症状、痛み、お悩みなどがあればご記入ください" 
              />
            </div>
          </div>

          {/* 同意書セクション */}
          <div className="mb-8 border-t pt-8">
            <h3 className="text-lg font-bold mb-4">ご予約にあたっての同意事項</h3>
            <p className="text-sm text-gray-600 mb-6">
              ご予約前に以下の内容をご確認いただき、同意の上でご予約ください。
            </p>

            {/* 施術に関する同意事項 */}
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

            {/* キャンセルポリシー */}
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

            {/* 免責事項 */}
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

            {/* 同意チェックボックス */}
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
              disabled={!consentChecked}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                consentChecked
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              ご予約内容の確認へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
