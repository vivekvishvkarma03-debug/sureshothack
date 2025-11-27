// Use Next.js API routes (same origin, no CORS needed)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
  user?: User;
}

export interface SignupData {
  email: string;
  fullName: string;
  password: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  isPremium?: boolean;
  isVip?: boolean;
  vipExpiresAt?: string | null;
  createdAt?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      // Import dynamically to avoid SSR issues
      const { getToken } = require('./storage');
      const token = getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async signup(data: SignupData): Promise<ApiResponse> {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signin(data: SigninData): Promise<ApiResponse> {
    return this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/api/user/me');
  }

  async updateVipStatus(data: { isVip: boolean; isPremium?: boolean }): Promise<ApiResponse<User>> {
    return this.request('/api/user/vip', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createPaymentOrder(amount: number, currency: string = 'INR'): Promise<ApiResponse & { order?: { id: string; amount: number; currency: string; receipt: string } }> {
    return this.request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    }) as Promise<ApiResponse & { order?: { id: string; amount: number; currency: string; receipt: string } }>;
  }

  async verifyPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse & { payment?: { orderId: string; paymentId: string }; user?: User }> {
    return this.request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }) as Promise<ApiResponse & { payment?: { orderId: string; paymentId: string }; user?: User }>;
  }

  // Game API methods
  async getGameTypes(): Promise<ApiResponse & { data?: Array<{ id: string; name: string; icon: string }> }> {
    return this.request('/api/game/types') as Promise<ApiResponse & { data?: Array<{ id: string; name: string; icon: string }> }>;
  }

  async getGamePeriods(gameType: string): Promise<ApiResponse & { data?: Array<any> }> {
    return this.request(`/api/game/periods?gameType=${gameType}`) as Promise<ApiResponse & { data?: Array<any> }>;
  }

  async startGame(gameType: string, timeInterval: string): Promise<ApiResponse & { data?: any }> {
    return this.request('/api/game/start', {
      method: 'POST',
      body: JSON.stringify({ gameType, timeInterval }),
    }) as Promise<ApiResponse & { data?: any }>;
  }

  async submitPrediction(data: {
    gameType: string;
    periodNumber: string;
    prediction: string;
    timeInterval: string;
  }): Promise<ApiResponse & { data?: any }> {
    return this.request('/api/game/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }) as Promise<ApiResponse & { data?: any }>;
  }

  async getGameResults(gameType: string, periodNumber: string): Promise<ApiResponse & { data?: any }> {
    return this.request(`/api/game/results?gameType=${gameType}&periodNumber=${periodNumber}`) as Promise<ApiResponse & { data?: any }>;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

