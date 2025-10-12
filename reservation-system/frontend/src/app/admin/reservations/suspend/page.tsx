'use client';
import { useState, useEffect } from 'react';

type SlotStatus = 'available' | 'suspended' | 'booked';

export default function SuspendPage() {
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(9); // 9月
  const [bulkStartDate, setBulkStartDate] = useState(''); // 一括停止の開始日
  const [pendingChanges, setPendingChanges] = useState<Record<string, SlotStatus>>({}); // 変更待ちのスロット
  const [isUpdating, setIsUpdating] = useState(false); // 更新中フラグ
  const [originalSlots, setOriginalSlots] = useState<Record<string, SlotStatus>>({}); // 元の状態を保持

  // 時間枠（11:00-21:00）
  const timeSlots = [
    '11:00', '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  // その月の日数を取得
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 曜日を取得
  const getDayOfWeek = (day: number) => {
    const date = new Date(currentYear, currentMonth - 1, day);
    return ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  };

  // スロットの状態管理（APIから取得）
  const [slots, setSlots] = useState<Record<string, SlotStatus>>({});
  const [loading, setLoading] = useState(true);

  // APIからブロック状況を取得
  const fetchBlockedSlots = async () => {
    setLoading(true);
    let response: Response | undefined;
    try {
      const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

      response = await fetch(`http://localhost:3001/api/admin/blocked-slots?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`ブロック状況の取得に失敗しました (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        const newSlots: Record<string, SlotStatus> = {};
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // 全スロットを初期化（available）
        days.forEach(day => {
          timeSlots.forEach(time => {
            const key = `${day}-${time}`;
            newSlots[key] = 'available';
          });
        });

        // ブロックされたスロットをsuspendedに設定
        data.data.blockedSlots.forEach((block: any) => {
          const blockDate = new Date(block.block_date);
          const day = blockDate.getDate();
          const time = block.start_time;
          const key = `${day}-${time}`;
          newSlots[key] = 'suspended';
        });

        // 既存の予約をbookedに設定
        try {
          const reservationResponse = await fetch(`http://localhost:3001/api/admin/reservations?startDate=${startDate}&endDate=${endDate}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          });

          if (reservationResponse.ok) {
            const reservationData = await reservationResponse.json();
            if (reservationData.success) {
              reservationData.data.reservations.forEach((reservation: any) => {
                const reservationDate = new Date(reservation.reservation_date);
                const day = reservationDate.getDate();
                // 時間フォーマットを11:00:00 -> 11:00に変換
                const time = reservation.start_time.substring(0, 5);
                const key = `${day}-${time}`;

                // 現在表示中の月に含まれる予約のみ処理
                if (reservationDate.getFullYear() === currentYear && (reservationDate.getMonth() + 1) === currentMonth) {
                  newSlots[key] = 'booked';
                }
              });
            }
          }
        } catch (reservationError) {
          console.error('予約データ取得エラー:', reservationError);
        }

        setSlots(newSlots);
        setOriginalSlots(newSlots);
      }
    } catch (error) {
      console.error('ブロック状況取得エラー:', error);
      if (response) {
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        try {
          const errorText = await response.text();
          console.error('Response body:', errorText);
        } catch (e) {
          console.error('Error reading response body:', e);
        }
      }
      alert('ブロック状況の取得に失敗しました: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 月が変更された時にデータを再取得
  useEffect(() => {
    fetchBlockedSlots();
  }, [currentYear, currentMonth]);

  // 前月・翌月
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // スロットクリックでステータス変更（変更待ちリストに追加）
  const toggleSlot = (day: number, time: string) => {
    const key = `${day}-${time}`;
    const current = slots[key] || 'available';

    // booked は変更不可
    if (current === 'booked') {
      return;
    }

    let newStatus: SlotStatus;
    if (current === 'available') {
      newStatus = 'suspended';
    } else if (current === 'suspended') {
      newStatus = 'available';
    } else {
      return;
    }

    // ローカル表示を即座に更新
    setSlots(prev => ({ ...prev, [key]: newStatus }));

    // 元の状態と比較して変更リストを更新
    setPendingChanges(prev => {
      const originalStatus = originalSlots[key] || 'available';
      const newChanges = { ...prev };

      if (newStatus === originalStatus) {
        // 元の状態に戻った場合は変更リストから削除
        delete newChanges[key];
      } else {
        // 元の状態と異なる場合は変更リストに追加
        newChanges[key] = newStatus;
      }

      return newChanges;
    });
  };

  // 指定日から一括停止
  const suspendBulk = async (days: number) => {
    if (!bulkStartDate) {
      alert('開始日を選択してください');
      return;
    }

    const newSlots = { ...slots };
    const newPendingChanges = { ...pendingChanges };
    const startDate = new Date(bulkStartDate);

    for (let i = 0; i < days; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + i);

      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();

      // 現在表示中の月のみ処理
      if (targetYear === currentYear && targetMonth === currentMonth) {
        timeSlots.forEach(time => {
          const key = `${targetDay}-${time}`;
          if (newSlots[key] !== 'booked') {
            newSlots[key] = 'suspended';

            // 元の状態と比較して変更リストを更新
            const originalStatus = originalSlots[key] || 'available';
            if ('suspended' !== originalStatus) {
              newPendingChanges[key] = 'suspended';
            } else {
              delete newPendingChanges[key];
            }
          }
        });
      }
    }

    setSlots(newSlots);
    setPendingChanges(newPendingChanges);
    alert(`${bulkStartDate}から${days}日間を受付停止に設定しました。「変更を適用」ボタンでデータベースに保存してください。`);
  };

  // 変更を適用する関数
  const applyChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      alert('変更がありません');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('http://localhost:3001/api/admin/blocked-slots', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          changes: pendingChanges,
          year: currentYear,
          month: currentMonth
        })
      });

      if (!response.ok) {
        throw new Error('変更の適用に失敗しました');
      }

      const data = await response.json();
      if (data.success) {
        // 成功した場合、変更待ちリストをクリアし、元の状態を更新
        setPendingChanges({});
        setOriginalSlots(slots);
        alert(data.message || '変更を適用しました');
      } else {
        throw new Error(data.error || '変更の適用に失敗しました');
      }
    } catch (error: any) {
      console.error('変更適用エラー:', error);
      alert(error.message || '変更の適用に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // セルの表示
  const renderCell = (day: number, time: string) => {
    const key = `${day}-${time}`;
    const status = slots[key] || 'available';
    
    let bgColor = 'bg-white';
    let symbol = '○';
    let textColor = 'text-gray-900';
    let fontSize = 'text-sm';
    
    if (status === 'suspended') {
      bgColor = 'bg-gray-300';
      symbol = '×';
      textColor = 'text-gray-600';
      fontSize = 'text-sm';
    } else if (status === 'booked') {
      bgColor = 'bg-yellow-100';
      symbol = '◎';
      textColor = 'text-gray-900';
      fontSize = 'text-xs';
    }
    
    return (
      <td
        key={key}
        className={`border border-gray-200 p-2 text-center cursor-pointer hover:opacity-80 transition-opacity ${bgColor}`}
        onClick={() => toggleSlot(day, time)}
      >
        <span className={`${fontSize} ${textColor}`}>{symbol}</span>
      </td>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">予約受付停止設定画面</h1>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
          <span className="text-gray-700">データを読み込んでいます...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">予約受付停止設定画面</h1>

      {/* 凡例 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-8 text-sm">
          {/* 1つ目 */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-10 bg-yellow-100 border border-gray-300 flex items-center justify-center text-sm">
              ◎
            </div>
            <span className="font-medium text-gray-900">お客様から予約</span>
          </div>
          
          {/* 2つ目 */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-10 bg-white border border-gray-300 flex items-center justify-center text-lg">
              ○
            </div>
            <span className="font-medium text-gray-900">空き</span>
          </div>
          
          {/* 3つ目 */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-10 bg-gray-300 border border-gray-300 flex items-center justify-center text-gray-700 text-lg">
              ×
            </div>
            <span className="font-medium text-gray-900">受付不可</span>
          </div>
        </div>
      </div>

      {/* 月の選択 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md"
          >
            « 前月
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentYear}年{currentMonth}月
          </h2>
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded-md"
          >
            翌月 »
          </button>
        </div>

        {/* カレンダーテーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900">
                  時間
                </th>
                {days.map(day => (
                  <th key={day} className="border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-900">
                    <div>{day}</div>
                    <div className="text-xs text-gray-700">({getDayOfWeek(day)})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td className="border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {time}
                  </td>
                  {days.map(day => renderCell(day, time))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 変更ボタン */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={applyChanges}
            disabled={Object.keys(pendingChanges).length === 0 || isUpdating}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUpdating ? '更新中...' : '変更を適用'}
          </button>
          <div className="text-sm text-gray-600">
            {Object.keys(pendingChanges).length > 0 ? (
              <span className="text-orange-600 font-medium">
                {Object.keys(pendingChanges).length}件の変更があります
              </span>
            ) : (
              <span>変更はありません</span>
            )}
          </div>
        </div>
      </div>

      {/* 一括操作ボタン */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">一括操作</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              開始日を選択
            </label>
            <input
              type="date"
              value={bulkStartDate}
              onChange={(e) => setBulkStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => suspendBulk(7)}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              7日間受付停止
            </button>
            <button
              onClick={() => suspendBulk(14)}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              14日間受付停止
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}