'use client';
import { useRouter } from 'next/navigation';

export default function ReserveCompletePage() {
  const router = useRouter();

  const handleNewReservation = () => {
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
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">ご予約が完了しました</h2>
            <p className="text-gray-600 mb-6">この度はご予約いただき、誠にありがとうございます。<br />ご予約の確認メールをお送りいたしました。</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">ご予約内容</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">プラン：</span>
                <span className="font-medium">9月 初回体験</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">日時：</span>
                <span className="font-medium">2025年09月16日(火) 13:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">お名前：</span>
                <span className="font-medium">山田太郎</span>
              </div>
            </div>
          </div>
          <button onClick={handleNewReservation} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            新しいご予約へ
          </button>
        </div>
      </div>
    </div>
  );
}