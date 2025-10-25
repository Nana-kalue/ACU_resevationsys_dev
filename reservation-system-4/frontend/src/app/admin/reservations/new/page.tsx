'use client';

import React from 'react';
import Link from 'next/link';

export default function ReservationNewPage() {
  return (
    <div className="max-w-3xl">
      {/* ページタイトル */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">予約登録</h1>
        <p className="text-gray-600 mt-2">
          お客様と同じページから予約を登録できます
        </p>
      </div>

      {/* 案内カード */}
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-900">予約フォームを開く</h2>
        <p className="text-gray-600 mb-6">
          管理者として、お客様の予約を代理で入力できます。
          <br />
          予約フォームに進んで、日時とお客様情報を入力してください。
        </p>

        <Link
          href="/reserve"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          予約フォームを開く →
        </Link>

        <p className="text-sm text-gray-500 mt-4">
          ※ 新しいタブで開きます
        </p>
      </div>

      {/* 注意事項 */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">注意事項</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• お客様のメールアドレスを正確に入力してください</li>
              <li>• 予約の確認・変更は「予約一覧」から行えます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}