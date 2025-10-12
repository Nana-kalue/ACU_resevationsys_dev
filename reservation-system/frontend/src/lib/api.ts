// API設定とヘルパー関数
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price?: number;
  duration: number;
  is_active: boolean;
}

export interface ReservationFormData {
  planId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Availability {
  [time: string]: {
    available: boolean;
    reason?: string;
  };
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'ネットワークエラーが発生しました'
      };
    }
  }

  // プラン一覧取得
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    return this.request<Plan[]>('/public/plans');
  }

  // 空き状況取得
  async getAvailability(date: string, planId: string): Promise<ApiResponse<{ [date: string]: Availability }>> {
    const params = new URLSearchParams({ date, planId });
    return this.request<{ [date: string]: Availability }>(`/public/availability?${params}`);
  }

  // 予約作成
  async createReservation(data: ReservationFormData): Promise<ApiResponse<{ reservationNumber: string }>> {
    return this.request<{ reservationNumber: string }>('/public/reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 予約確認
  async checkReservation(reservationNumber: string, email: string): Promise<ApiResponse<any>> {
    return this.request<any>('/public/reserve/check', {
      method: 'POST',
      body: JSON.stringify({ reservationNumber, email }),
    });
  }

  // 予約キャンセル
  async cancelReservation(reservationNumber: string, email: string, reason?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/public/reserve/cancel', {
      method: 'POST',
      body: JSON.stringify({ reservationNumber, email, reason }),
    });
  }
}

export const apiClient = new ApiClient();