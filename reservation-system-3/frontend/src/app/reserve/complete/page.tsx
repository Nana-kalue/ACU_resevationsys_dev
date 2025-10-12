'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ReserveCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationNumber = searchParams.get('reservationNumber');

  useEffect(() => {
    // 予約番号がない場合はトップページにリダイレクト
    if (!reservationNumber) {
      router.push('/reserve');
    }
  }, [reservationNumber, router]);

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

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* 完了アイコン */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* 完了メッセージ */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ご予約が完了しました
          </h1>

          {reservationNumber && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">予約番号</p>
              <p className="text-2xl font-bold text-blue-600">
                {reservationNumber}
              </p>
            </div>
          )}

          <div className="mb-8">
            <p className="text-gray-700 mb-4">
              ご予約ありがとうございます。
            </p>
            <p className="text-sm text-gray-600">
              ご登録いただいたメールアドレスに確認メールを送信いたしました。
              <br />
              メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
          </div>

          {/* 注意事項 */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg text-left">
            <h3 className="font-semibold text-gray-900 mb-4">
              ご予約にあたって
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">1.</span>
                確認メールをお送りしますので、内容をご確認ください
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">2.</span>
                予約当日は、お時間の5分前にお越しください
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">3.</span>
                キャンセルや変更が必要な場合は、2営業日前までにご連絡ください
              </li>
            </ul>
          </div>

          <div className="text-sm text-gray-500 mb-6">
            ※ 確認メールが届かない場合は、迷惑メールフォルダをご確認いただくか、
            <br />
            お電話にてお問い合わせください。
          </div>

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNewReservation}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              新しい予約を作成
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-block"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}