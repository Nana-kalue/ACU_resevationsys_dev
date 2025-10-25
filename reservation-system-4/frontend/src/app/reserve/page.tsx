'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReservation } from '@/contexts/ReservationContext';
import { apiClient, Availability } from '@/lib/api';

export default function ReservePage() {
  const router = useRouter();
  const {
    selectedPlan,
    setSelectedPlan,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime
  } = useReservation();

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      loadAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan, currentWeek]);

  const loadPlans = async () => {
    try {
      const response = await apiClient.getPlans();
      if (response.success && response.data) {
        setPlans(response.data);
        if (response.data.length > 0 && !selectedPlan) {
          setSelectedPlan(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadAvailability = async () => {
    if (!selectedPlan) return;

    const weekDates = getWeekDates(currentWeek);
    const availabilityData: Record<string, Availability> = {};

    // 各日付の空き状況を並列で取得
    await Promise.all(
      weekDates.map(async (dateInfo) => {
        const dateStr = formatDateForAPI(dateInfo.fullDate);
        const response = await apiClient.getAvailability(dateStr, selectedPlan.id);
        if (response.success && response.data) {
          availabilityData[dateStr] = response.data[dateStr];
        }
      })
    );

    setAvailability(availabilityData);
  };

  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + weekOffset * 7);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
        fullDate: date
      });
    }
    return dates;
  };

  const timeSlots = [
    '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  const changeWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => direction === 'next' ? prev + 1 : prev - 1);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleNext = () => {
    if (selectedDate && selectedTime) {
      router.push('/reserve/step2');
    }
  };

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

  const isTimeSlotAvailable = (dateInfo: any, time: string): boolean => {
    const dateStr = formatDateForAPI(dateInfo.fullDate);
    // APIは "11:00" 形式で返すので、秒なしで確認
    const availabilityInfo = availability[dateStr]?.[time];
    // availabilityがまだ読み込まれていない場合はtrueを返す（デフォルトで予約可能）
    if (!availability[dateStr]) return true;
    return availabilityInfo?.available !== false;
  };

  const weekDates = getWeekDates(currentWeek);
  const currentMonth = weekDates[0].fullDate.getMonth() + 1;
  const currentYear = weekDates[0].fullDate.getFullYear();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
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

        <h1 className="text-center text-2xl font-bold mb-12 text-gray-900">ご予約フォーム</h1>

        {/* ステップ表示 */}
        <div className="flex justify-center items-center mb-12 overflow-x-auto">
          <div className="flex items-center min-w-max">
            {/* Step 1 */}
            <div className="w-10 h-10 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="text-center ml-1 mr-4">
              <div className="text-xs font-medium">日時選択</div>
            </div>
            <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>

            {/* Step 2 */}
            <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div className="text-center ml-1 mr-4">
              <div className="text-xs font-medium text-gray-600">基本情報</div>
            </div>
            <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>

            {/* Step 3 */}
            <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div className="text-center ml-1 mr-4">
              <div className="text-xs font-medium text-gray-600">事前問診</div>
            </div>
            <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>

            {/* Step 4 */}
            <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div className="text-center ml-1">
              <div className="text-xs font-medium text-gray-600">内容確認</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 border-2 border-gray-400 rounded-full flex items-center justify-center font-bold text-gray-600">
              1<span className="text-sm ml-1">/4</span>
            </div>
            <h2 className="text-xl font-bold ml-4 text-gray-900">日時を選ぶ</h2>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ご希望のメニュー
            </label>
            <select
              value={selectedPlan?.id || ''}
              onChange={(e) => {
                const plan = plans.find(p => p.id === e.target.value);
                setSelectedPlan(plan);
              }}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.display_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{currentYear}年{currentMonth}月</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => changeWeek('prev')}
                  disabled={currentWeek === 0}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  前の週
                </button>
                <button
                  onClick={() => changeWeek('next')}
                  disabled={currentWeek >= 4}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  次の週
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-sm font-medium text-gray-700">時間</th>
                    {weekDates.map((dateInfo, idx) => (
                      <th key={idx} className="border border-gray-300 p-2 text-sm font-medium text-gray-700">
                        {dateInfo.date}<br />({dateInfo.dayOfWeek})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time) => (
                    <tr key={time}>
                      <td className="border border-gray-300 p-2 text-center font-medium text-gray-700">{time}</td>
                      {weekDates.map((dateInfo, idx) => {
                        const isSelected = selectedDate === dateInfo.date && selectedTime === time;
                        const isAvailable = isTimeSlotAvailable(dateInfo, time);
                        return (
                          <td key={idx} className="border border-gray-300 p-0">
                            <button
                              onClick={() => {
                                if (isAvailable) {
                                  setSelectedDate(dateInfo.date);
                                  setSelectedTime(time);
                                }
                              }}
                              disabled={!isAvailable}
                              className={`w-full h-12 transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : isAvailable
                                  ? 'bg-white hover:bg-blue-50 text-gray-700'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {isAvailable ? '◯' : '×'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedDate && selectedTime && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-800">
                選択された日時: {getSelectedDateTime()}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedDate || !selectedTime}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                selectedDate && selectedTime
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              お客様情報の入力へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}