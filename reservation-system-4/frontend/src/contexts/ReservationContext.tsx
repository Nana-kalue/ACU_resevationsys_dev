'use client';
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Plan } from '@/lib/api';

interface FormData {
  name: string;
  furigana: string;
  gender: string;
  birthdate: string;
  age: string;
  phone: string;
  email: string;
  address: string;
}

interface QuestionnaireData {
  symptoms: string;
  medicalHistory: string;
  currentMedication: string;
  allergies: string;
  pregnancy: string;
  otherNotes: string;
}

interface ReservationContextType {
  selectedPlan: Plan | null;
  setSelectedPlan: (plan: Plan | null) => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  formData: FormData;
  setFormData: (data: FormData) => void;
  questionnaireData: QuestionnaireData;
  setQuestionnaireData: (data: QuestionnaireData) => void;
  getCompleteFormData: () => any;
  resetReservation: () => void;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

interface ReservationProviderProps {
  children: ReactNode;
}

export function ReservationProvider({ children }: ReservationProviderProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    furigana: '',
    gender: '',
    birthdate: '',
    age: '',
    phone: '',
    email: '',
    address: ''
  });

  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>({
    symptoms: '',
    medicalHistory: '',
    currentMedication: '',
    allergies: '',
    pregnancy: '',
    otherNotes: ''
  });

  const getCompleteFormData = () => {
    if (!selectedPlan || !selectedDate || !selectedTime || !formData.name) {
      return null;
    }

    const [month, day] = selectedDate.split('/');
    const year = new Date().getFullYear();
    const reservationDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    return {
      planId: selectedPlan.id,
      reservationDate,
      startTime: selectedTime,
      customer: {
        name: formData.name,
        furigana: formData.furigana,
        gender: formData.gender,
        birthdate: formData.birthdate,
        age: formData.age,
        phone: formData.phone,
        email: formData.email,
        address: formData.address
      },
      questionnaire: {
        symptoms: questionnaireData.symptoms,
        medicalHistory: questionnaireData.medicalHistory,
        currentMedication: questionnaireData.currentMedication,
        allergies: questionnaireData.allergies,
        pregnancy: questionnaireData.pregnancy,
        otherNotes: questionnaireData.otherNotes
      }
    };
  };

  const resetReservation = () => {
    setSelectedPlan(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({
      name: '',
      furigana: '',
      gender: '',
      birthdate: '',
      age: '',
      phone: '',
      email: '',
      address: ''
    });
    setQuestionnaireData({
      symptoms: '',
      medicalHistory: '',
      currentMedication: '',
      allergies: '',
      pregnancy: '',
      otherNotes: ''
    });
  };

  const value = React.useMemo(() => ({
    selectedPlan,
    setSelectedPlan,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    formData,
    setFormData,
    questionnaireData,
    setQuestionnaireData,
    getCompleteFormData,
    resetReservation
  }), [selectedPlan, selectedDate, selectedTime, formData, questionnaireData]);

  return (
    <ReservationContext.Provider value={value}>
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