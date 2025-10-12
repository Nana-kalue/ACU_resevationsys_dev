'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useReservation } from '@/contexts/ReservationContext';

export default function ReserveCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetReservation } = useReservation();
  const [reservationNumber, setReservationNumber] = useState<string | null>(null);

  const handleNewReservation = () => {
    resetReservation();
    router.push('/reserve');
  };

  useEffect(() => {
    const number = searchParams.get('reservationNumber');
    if (!number) {
      router.push('/reserve');
      return;
    }
    setReservationNumber(number);
  }, [searchParams, router]);

  if (!reservationNumber) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-800">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        <div className="text-center mb-8">
          <div className="w-32 h-16 mx-auto bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-600 text-sm">LOGO</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">

          {/* 成功アイコン */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">ご予約が完了しました</h1>

          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              ご予約いただき、ありがとうございます。<br />
              以下の予約番号でご予約を承りました。
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">予約番号</p>
              <p className="text-2xl font-bold text-blue-600 font-mono tracking-wider">
                {reservationNumber}
              </p>
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">次のステップ</h3>
              <ul className="text-sm text-gray-600 space-y-2">
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
                  キャンセルや変更が必要な場合は、お早めにご連絡ください
                </li>
              </ul>
            </div>

            <div className="text-sm text-gray-500 mb-6">
              ※ 確認メールが届かない場合は、迷惑メールフォルダをご確認いただくか、<br />
              お電話にてお問い合わせください。
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNewReservation}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              新しい予約を作成
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              トップページに戻る
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}