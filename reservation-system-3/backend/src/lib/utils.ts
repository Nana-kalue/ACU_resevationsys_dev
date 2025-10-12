import { format, parseISO } from 'date-fns';

const TIMEZONE = 'Asia/Tokyo';

export function formatJSTDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

export function formatJSTTime(time: string) {
  return format(parseISO(`2000-01-01T${time}`), 'HH:mm');
}

export function formatJSTDateTime(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
}

export function generateTimeSlots(startHour: number = 11, endHour: number = 21): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
}


export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\-\(\)\+\s]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}


export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    environment: process.env.NODE_ENV
  };
  
  console.log(JSON.stringify(logEntry));
  
  if (process.env.NODE_ENV === 'production') {
    // 本番環境では外部ログサービスに送信
  }
}