'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReservation } from '@/contexts/ReservationContext';
import { apiClient, Plan, Availability } from '@/lib/api';

export default function ReservePage() {
  const router = useRouter();
  const {
    selectedPlan,
    selectedDate,
    selectedTime,
    cachedPlans,
    cachedAvailability,
    currentWeek,
    setSelectedPlan,
    setSelectedDate,
    setSelectedTime,
    setCachedPlans,
    setCachedAvailability,
    setCurrentWeek
  } = useReservation();

  // State (キャッシュから初期化)
  const [plans, setPlans] = useState<Plan[]>(cachedPlans);
  const [availability, setAvailability] = useState<{ [date: string]: Availability }>(cachedAvailability);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 時間枠の設定
  const timeSlots = [
    '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // プラン一覧を取得（キャッシュ活用）
  useEffect(() => {
    const fetchPlans = async () => {
      // キャッシュがある場合はAPIを呼ばない
      if (cachedPlans.length > 0) {
        setPlans(cachedPlans);
        if (cachedPlans.length > 0 && !selectedPlan) {
          setSelectedPlan(cachedPlans[0]);
        }
        return;
      }

      setLoading(true);
      try {
        const response = await apiClient.getPlans();
        if (response.success && response.data) {
          setPlans(response.data);
          setCachedPlans(response.data); // キャッシュに保存

          // 最初に取得したときのみ、最初のプランを選択する
          if (response.data.length > 0 && !selectedPlan) {
            setSelectedPlan(response.data[0]);
          }
        } else {
          setError(response.message || 'プランの取得に失敗しました');
        }
      } catch (err) {
        setError('ネットワークエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [cachedPlans, selectedPlan, setSelectedPlan, setCachedPlans]); // Remove selectedPlan dependency to avoid infinite loop

  // 週の日付を計算
  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const dates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (weekOffset * 7) + i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

      dates.push({
        date: `${month}/${day}`,
        dayOfWeek: dayOfWeek,
        fullDate: date,
        isoString: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` // YYYY-MM-DD format (ローカル時間)
      });
    }

    return dates;
  };

  // 空き状況を取得
  const fetchAvailability = async (weekDates: any[]) => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const availabilityData: { [date: string]: Availability } = {};

      // 並列処理で全ての日付の空き状況を同時取得（高速化）
      const promises = weekDates.map(dateInfo =>
        apiClient.getAvailability(dateInfo.isoString, selectedPlan.id)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        if (response.success && response.data) {
          Object.assign(availabilityData, response.data);
        }
      });
      setAvailability(availabilityData);
      setCachedAvailability(prev => ({ ...prev, ...availabilityData })); // キャッシュに保存
    } catch (err) {
      setError('空き状況の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const weekDates = getWeekDates(currentWeek);

  // 週やプランが変更されたら空き状況を取得
  useEffect(() => {
    if (selectedPlan) {
      // キャッシュされた空き状況があるかチェック
      const weekDates = getWeekDates(currentWeek);
      const hasAllCachedData = weekDates.every(dateInfo =>
        cachedAvailability[dateInfo.isoString]
      );

      if (hasAllCachedData) {
        // キャッシュから即座にセット（高速表示）
        const relevantData: { [date: string]: Availability } = {};
        weekDates.forEach(dateInfo => {
          if (cachedAvailability[dateInfo.isoString]) {
            relevantData[dateInfo.isoString] = cachedAvailability[dateInfo.isoString];
          }
        });
        setAvailability(relevantData);
      } else {
        // キャッシュにない場合のみAPIを呼び出し
        fetchAvailability(weekDates);
      }
    }
  }, [selectedPlan?.id, currentWeek, cachedAvailability]);

  // 空き状況を確認
  const getAvailability = (date: string, time: string) => {
    const dateKey = weekDates.find(d => d.date === date)?.isoString;
    if (!dateKey || !availability[dateKey]) {
      return false;
    }
    return availability[dateKey][time]?.available || false;
  };

  // 時間枠をクリック
  const handleTimeSlotClick = (date: string, time: string) => {
    const available = getAvailability(date, time);

    if (available) {
      setSelectedDate(date);
      setSelectedTime(time);
    }
  };

  // 週を変更
  const changeWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next' ? currentWeek + 1 : currentWeek - 1;
    setCurrentWeek(newWeek);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  // プラン変更
  const handlePlanChange = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setSelectedDate(null);
      setSelectedTime(null);
    }
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
      if (selectedDateInfo) {
        const year = selectedDateInfo.fullDate.getFullYear();
        const month = selectedDateInfo.fullDate.getMonth() + 1;
        const day = selectedDateInfo.fullDate.getDate();
        const dayOfWeek = selectedDateInfo.dayOfWeek;

        return `${year}年${month}月${day}日(${dayOfWeek}) ${selectedTime}`;
      }
    }
    return "日付が選択されていません";
  };

  const currentMonth = weekDates[0].fullDate.getMonth() + 1;
  const currentYear = weekDates[0].fullDate.getFullYear();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-center text-2xl font-bold mb-12 text-gray-900">ご予約フォーム</h1>

        {/* ステップ表示 */}
        <div className="flex justify-center items-center mb-12">
          <div className="flex items-center">
            {/* Step 1 */}
            <div className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="text-center ml-2 mr-8">
              <div className="text-sm font-medium text-gray-800">日時を選ぶ</div>
            </div>

            {/* 線 */}
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>

            {/* Step 2 */}
            <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="text-center ml-2 mr-8">
              <div className="text-sm font-medium text-gray-800">お客様情報の入力</div>
            </div>

            {/* 線 */}
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>

            {/* Step 3 */}
            <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="text-center ml-2">
              <div className="text-sm font-medium text-gray-800">ご予約内容の確認</div>
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
            <h2 className="text-xl font-bold ml-4 text-gray-900">日時を選ぶ</h2>
          </div>

          {/* メニュー選択 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-800 mb-3">
              ご希望のメニュー
            </label>
            <select
              className="w-96 px-4 py-2 border border-gray-300 rounded-md bg-white font-medium text-gray-900"
              value={selectedPlan?.id || ''}
              onChange={(e) => handlePlanChange(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled className="text-gray-500">
                メニューを選択してください
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id} className="text-gray-900">
                  {plan.display_name} {plan.price && `- ¥${plan.price.toLocaleString()}`}
                </option>
              ))}
            </select>
          </div>

          {/* ローディング表示（データがない場合のみ） */}
          {loading && plans.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">データを読み込んでいます...</p>
            </div>
          )}

          {/* カレンダー */}
          {((!loading && plans.length > 0) || plans.length > 0) && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{currentYear}年{currentMonth}月</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => changeWeek('prev')}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800"
                    disabled={loading || currentWeek <= 0}
                  >
                    前の週
                  </button>
                  <button
                    onClick={() => changeWeek('next')}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-800"
                    disabled={loading}
                  >
                    次の週
                  </button>
                </div>
              </div>

              {/* 日付ヘッダー */}
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="p-2 text-center text-sm font-medium text-gray-800">時間</div>
                {weekDates.map((dateInfo) => (
                  <div key={dateInfo.date} className="p-2 text-center text-sm">
                    <div className="font-medium text-gray-800">{dateInfo.date}</div>
                    <div className="text-xs text-gray-600">({dateInfo.dayOfWeek})</div>
                  </div>
                ))}
              </div>

              {/* 時間枠 */}
              <div className="space-y-1">
                {timeSlots.map((time) => (
                  <div key={time} className="grid grid-cols-8 gap-2">
                    <div className="p-2 text-center text-sm font-medium bg-gray-100 text-gray-800">
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
                              ? 'text-gray-600 cursor-not-allowed bg-gray-50'
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
          )}

          {/* 選択した日時の表示 */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">選択された日時:</p>
            <p className="font-semibold text-blue-800">{getSelectedDateTime()}</p>
          </div>

          {/* 次へボタン */}
          <div className="mt-6 text-center">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedDate || !selectedTime}
            >
              お客様情報の入力へ →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}