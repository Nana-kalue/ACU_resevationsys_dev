'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { Plan, ReservationFormData, Availability } from '@/lib/api';

interface ReservationContextType {
  // 選択されたデータ
  selectedPlan: Plan | null;
  selectedDate: string | null;
  selectedTime: string | null;
  formData: Partial<ReservationFormData>;

  // キャッシュされたデータ
  cachedPlans: Plan[];
  cachedAvailability: { [date: string]: Availability };
  currentWeek: number;

  // データ更新関数
  setSelectedPlan: (plan: Plan | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedTime: (time: string | null) => void;
  setFormData: (data: Partial<ReservationFormData>) => void;

  // キャッシュ更新関数
  setCachedPlans: (plans: Plan[]) => void;
  setCachedAvailability: (availability: { [date: string]: Availability }) => void;
  setCurrentWeek: (week: number) => void;

  // リセット関数
  resetReservation: () => void;

  // 完全なフォームデータを取得
  getCompleteFormData: () => ReservationFormData | null;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export function ReservationProvider({ children }: { children: ReactNode }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormDataState] = useState<Partial<ReservationFormData>>({});

  // キャッシュ用の状態
  const [cachedPlans, setCachedPlans] = useState<Plan[]>([]);
  const [cachedAvailability, setCachedAvailability] = useState<{ [date: string]: Availability }>({});
  const [currentWeek, setCurrentWeek] = useState<number>(0);

  const setFormData = (data: Partial<ReservationFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  };

  const resetReservation = () => {
    setSelectedPlan(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormDataState({});
    // キャッシュもクリアして最新の空き状況を取得するように
    setCachedAvailability({});
    setCurrentWeek(0);
  };

  const getCompleteFormData = (): ReservationFormData | null => {
    if (!selectedPlan?.id || !selectedDate || !selectedTime || !formData.name || !formData.email || !formData.phone) {
      return null;
    }

    return {
      planId: selectedPlan.id,
      date: selectedDate,
      time: selectedTime,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      notes: formData.notes,
    };
  };

  return (
    <ReservationContext.Provider
      value={{
        selectedPlan,
        selectedDate,
        selectedTime,
        formData,
        cachedPlans,
        cachedAvailability,
        currentWeek,
        setSelectedPlan,
        setSelectedDate,
        setSelectedTime,
        setFormData,
        setCachedPlans,
        setCachedAvailability,
        setCurrentWeek,
        resetReservation,
        getCompleteFormData,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
}