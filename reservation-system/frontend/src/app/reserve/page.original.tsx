'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReservePage() {
  const router = useRouter();
  
  // 選択された日時を記憶する
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0); // 0=今週, 1=来週, -1=先週など

  // 時間枠の設定
  const timeSlots = [
    '11:00', '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  // 今週の日付を計算（仮のデータ）
  const getWeekDates = (weekOffset: number) => {
    const baseDate = new Date(2025, 8, 13); // 2025年9月13日を基準
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + (weekOffset * 7) + i);
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      
      dates.push({
        date: `${month}/${day}`,
        dayOfWeek: dayOfWeek,
        fullDate: date
      });
    }
    
    return dates;
  };

  // 空き状況のダミーデータ（実際はAPIから取得）
  const getAvailability = (date: string, time: string) => {
    // 仮の空き状況パターン
    const unavailableTimes = [
      '9/13', '9/17', '9/19' // 土曜、水曜、金曜は一部時間が×
    ];
    
    // 特定の日付と時間で×にする
    if (date === '9/13' && ['11:00', '12:00', '15:00'].includes(time)) return false;
    if (date === '9/17' && ['14:00', '19:00'].includes(time)) return false;
    if (date === '9/19' && ['11:00', '17:00', '21:00'].includes(time)) return false;
    
    return true; // その他は○
  };

  // 時間枠をクリックしたときの処理
  const handleTimeSlotClick = (date: string, time: string) => {
    const available = getAvailability(date, time);
    
    if (available) {
      setSelectedDate(date);
      setSelectedTime(time);
    }
  };

  // 週を変更する
  const changeWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'next' ? prev + 1 : prev - 1);
    // 週を変更したら選択をリセット
    setSelectedDate(null);
    setSelectedTime(null);
  };

  // 次のステップに進む
  const handleNext = () => {
    if (selectedDate && selectedTime) {
      router.push('/reserve/step2');
    }
  };

  // 選択された日時の表示用
  const getSelectedDateTime = () => {
    if (selectedDate && selectedTime) {
      const weekDates = getWeekDates(currentWeek);
      const selectedDateInfo = weekDates.find(d => d.date === selectedDate);
      const year = selectedDateInfo?.fullDate.getFullYear();
      const month = selectedDateInfo?.fullDate.getMonth()! + 1;
      const day = selectedDateInfo?.fullDate.getDate();
      const dayOfWeek = selectedDateInfo?.dayOfWeek;
      
      return `${year}年${month}月${day}日(${dayOfWeek}) ${selectedTime}`;
    }
    return null;
  };

  const weekDates = getWeekDates(currentWeek);
  const currentMonth = weekDates[0].fullDate.getMonth() + 1;
  const currentYear = weekDates[0].fullDate.getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* ロゴ部分 */}
        <div className="text-center mb-8">
          <div className="w-32 h-16 mx-auto bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-600 text-sm">LOGO</span>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-center text-2xl font-bold mb-12">ご予約フォーム</h1>

        {/* ステップ表示 */}
        <div className="flex justify-center items-center mb-12">
          <div className="flex items-center">
            {/* Step 1 */}
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="text-center ml-2 mr-8">
              <div className="text-sm font-medium">日時を選ぶ</div>
            </div>
            
            {/* 線 */}
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
            
            {/* Step 2 */}
            <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="text-center ml-2 mr-8">
              <div className="text-sm font-medium">お客様情報の入力</div>
            </div>
            
            {/* 線 */}
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
            
            {/* Step 3 */}
            <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="text-center ml-2">
              <div className="text-sm font-medium">ご予約内容の確認</div>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-md p-8">
          
          {/* ステップタイトル */}
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              1<span className="text-sm ml-1">/3</span>
            </div>
            <h2 className="text-xl font-bold ml-4">日時を選ぶ</h2>
          </div>

          {/* メニュー選択 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ご希望のメニュー
            </label>
            <select className="w-96 px-4 py-2 border border-gray-300 rounded-md bg-gray-600 text-white font-medium">
              <option>9月 初回体験</option>
              <option>【ご新規様限定】2回券 29,800円（税込）</option>
              <option>通常メニュー</option>
            </select>
          </div>

          {/* カレンダー */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{currentYear}年{currentMonth}月</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => changeWeek('prev')}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  前の週
                </button>
                <button 
                  onClick={() => changeWeek('next')}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  次の週
                </button>
              </div>
            </div>
            
            {/* 日付ヘッダー */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="p-2 text-center text-sm font-medium text-gray-600">時間</div>
              {weekDates.map((dateInfo) => (
                <div key={dateInfo.date} className="p-2 text-center text-sm">
                  <div className="font-medium">{dateInfo.date}</div>
                  <div className="text-xs text-gray-500">({dateInfo.dayOfWeek})</div>
                </div>
              ))}
            </div>

            {/* 時間枠 */}
            <div className="space-y-1">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 gap-2">
                  <div className="p-2 text-center text-sm font-medium bg-gray-100">
                    {time}
                  </div>
                  {weekDates.map((dateInfo) => {
                    const available = getAvailability(dateInfo.date, time);
                    const isSelected = selectedDate === dateInfo.date && selectedTime === time;
                    
                    return (
                      <button
                        key={`${dateInfo.date}-${time}`}
                        onClick={() => handleTimeSlotClick(dateInfo.date, time)}
                        disabled={!available}
                        className={`p-2 text-center transition-colors ${
                          !available
                            ? 'text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-600 text-white font-bold rounded'
                            : 'text-blue-600 hover:bg-blue-50 rounded'
                        }`}
                      >
                        {available ? '○' : '×'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 次へボタン */}
          {selectedDate && selectedTime && (
            <div className="mt-6 text-center">
              <button 
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                お客様情報の入力へ →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}