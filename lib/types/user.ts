export interface User {
  id: string;
  email: string;
  fullName: string;
  password: string; // Hashed password
  isPremium?: boolean;
  isVip?: boolean;
  vipExpiresAt?: Date | null; // VIP subscription expiry date
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    isPremium?: boolean;
    isVip?: boolean;
    vipExpiresAt?: Date | string | null;
    createdAt?: Date | string;
  };
}

