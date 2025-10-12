export type AdminRole = 'admin' | 'member';

export interface Admin {
  id: number;
  loginId: string;
  isActive: boolean;
  role: AdminRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminFormData {
  loginId: string;
  password: string;
  confirmPassword: string;
  isActive: boolean;
  role: AdminRole;
}

export interface PasswordChangeData {
  newPassword: string;
  confirmPassword: string;
}