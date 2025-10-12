export interface Admin {
  id: string;
  loginId: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price?: number;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  planId: string;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled';
  notes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  plan?: Plan;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  reservations?: Reservation[];
}

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

export interface ReservationBlockout {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReservationFormData = {
  planId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
};

// 予約確認用のデータ
export type ReservationCheckData = {
  reservationNumber: string;
  email: string;
};

// 予約キャンセル用のデータ
export type ReservationCancelData = {
  reservationNumber: string;
  email: string;
  reason?: string;
};

// 管理者ログイン用のデータ
export type AdminLoginData = {
  loginId: string;
  password: string;
};

// JWT認証のレスポンス
export interface AuthResponse {
  token: string;
  admin: {
    id: string;
    loginId: string;
    name: string;
    role: string;
  };
  expiresIn: string;
}

export type ReservationStatus = 'confirmed' | 'cancelled';

export type AdminRole = 'admin' | 'super_admin';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}