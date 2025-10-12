'use client';
import { useRouter } from 'next/navigation';

export default function ReserveStep3Page() {
  const router = useRouter();

  const handleSubmit = () => {
    // 予約完了処理（後で実装）
    router.push('/reserve/complete');
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

        <div className="flex justify-center items-center mb-12">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <div className="text-center ml-2 mr-8"><div className="text-sm font-medium text-gray-600">日時を選ぶ</div></div>
            <div className="w-16 h-0.5 bg-gray-600 mx-4"></div>
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">✓</div>
            <div className="text-center ml-2 mr-8"><div className="text-sm font-medium text-gray-600">お客様情報の入力</div></div>
            <div className="w-16 h-0.5 bg-gray-600 mx-4"></div>
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
            <div className="text-center ml-2"><div className="text-sm font-medium">ご予約内容の確認</div></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              3<span className="text-sm ml-1">/3</span>
            </div>
            <h2 className="text-xl font-bold ml-4">ご予約内容の確認</h2>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">プラン</h3>
              <p className="text-gray-800">9月 初回体験</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">日時</h3>
              <p className="text-gray-800">2025年09月16日(火) 13:00</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">お名前</h3>
              <p className="text-gray-800">かるう</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">電話番号</h3>
              <p className="text-gray-800">00000000000</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">メールアドレス</h3>
              <p className="text-gray-800">karu@sample.com</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">ご要望</h3>
              <p className="text-gray-800">特に気になる症状はありません</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={handleBack} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              最初からやり直す
            </button>
            <button onClick={handleSubmit} className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              予約する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}