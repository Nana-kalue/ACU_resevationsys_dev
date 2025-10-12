import { z } from 'zod';

// 予約作成用スキーマ
export const reservationCreateSchema = z.object({
  planId: z.string().uuid('有効なプランIDを選択してください'),
  reservationDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    '有効な日付形式で入力してください (YYYY-MM-DD)'
  ),
  startTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    '有効な時間形式で入力してください (HH:MM)'
  ),
  customerName: z.string()
    .min(1, '顧客名は必須です')
    .max(100, '顧客名は100文字以内で入力してください')
    .trim(),
  customerEmail: z.string()
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以内で入力してください'),
  customerPhone: z.string()
    .min(10, '電話番号は10文字以上で入力してください')
    .max(20, '電話番号は20文字以内で入力してください')
    .regex(/^[\d\-\(\)\+\s]+$/, '有効な電話番号を入力してください'),
  notes: z.string()
    .max(500, 'ご要望は500文字以内で入力してください')
    .optional()
});

// 予約更新用スキーマ
export const reservationUpdateSchema = z.object({
  reservationDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    '有効な日付形式で入力してください (YYYY-MM-DD)'
  ).optional(),
  startTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    '有効な時間形式で入力してください (HH:MM)'
  ).optional(),
  endTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    '有効な時間形式で入力してください (HH:MM)'
  ).optional(),
  status: z.enum(['confirmed', 'cancelled'], {
    errorMap: () => ({ message: 'ステータスは confirmed または cancelled である必要があります' })
  }).optional(),
  notes: z.string()
    .max(500, 'ご要望は500文字以内で入力してください')
    .optional()
});

// 管理者作成用スキーマ
export const adminCreateSchema = z.object({
  loginId: z.string()
    .min(3, 'ログインIDは3文字以上で入力してください')
    .max(50, 'ログインIDは50文字以内で入力してください')
    .regex(/^[a-zA-Z0-9_]+$/, 'ログインIDは英数字とアンダースコアのみ使用可能です'),
  password: z.string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください'),
  isActive: z.boolean().optional().default(true)
});

// 管理者更新用スキーマ
export const adminUpdateSchema = z.object({
  password: z.string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .optional(),
  isActive: z.boolean().optional()
});

// プラン作成用スキーマ
export const planCreateSchema = z.object({
  name: z.string()
    .min(1, 'プラン名は必須です')
    .max(200, 'プラン名は200文字以内で入力してください')
    .trim(),
  description: z.string()
    .max(1000, 'プラン説明は1000文字以内で入力してください')
    .optional(),
  price: z.number()
    .int('価格は整数で入力してください')
    .min(0, '価格は0以上で入力してください')
    .max(999999, '価格は999,999円以下で入力してください')
    .optional(),
  isActive: z.boolean().optional().default(true)
});

// プラン更新用スキーマ
export const planUpdateSchema = z.object({
  name: z.string()
    .min(1, 'プラン名は必須です')
    .max(200, 'プラン名は200文字以内で入力してください')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'プラン説明は1000文字以内で入力してください')
    .optional(),
  price: z.number()
    .int('価格は整数で入力してください')
    .min(0, '価格は0以上で入力してください')
    .max(999999, '価格は999,999円以下で入力してください')
    .optional(),
  isActive: z.boolean().optional()
});

// ブロック枠作成用スキーマ
export const blockedSlotCreateSchema = z.object({
  blockDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    '有効な日付形式で入力してください (YYYY-MM-DD)'
  ),
  startTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    '有効な開始時間形式で入力してください (HH:MM)'
  ),
  endTime: z.string().regex(
    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    '有効な終了時間形式で入力してください (HH:MM)'
  ),
  reason: z.string()
    .max(200, '理由は200文字以内で入力してください')
    .optional()
}).refine(
  (data) => {
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    return start < end;
  },
  {
    message: '終了時間は開始時間より後である必要があります',
    path: ['endTime']
  }
);

// 日付範囲バリデーション用スキーマ
export const dateRangeSchema = z.object({
  startDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    '有効な開始日付形式で入力してください (YYYY-MM-DD)'
  ),
  endDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    '有効な終了日付形式で入力してください (YYYY-MM-DD)'
  )
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: '終了日は開始日以降である必要があります',
    path: ['endDate']
  }
);

// ページネーション用スキーマ
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'ページ番号は1以上である必要があります').default(1),
  limit: z.number().int().min(1).max(100, '取得件数は1-100の範囲で指定してください').default(20)
});

// バリデーションヘルパー関数
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['バリデーションエラーが発生しました'] };
  }
}

// 時間の妥当性チェック
export function isValidTimeSlot(startTime: string, endTime: string): boolean {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return start < end;
}

// 営業時間内チェック
export function isWithinBusinessHours(time: string): boolean {
  const hour = parseInt(time.split(':')[0]);
  return hour >= 11 && hour < 21; // 11:00-21:00
}

// 未来日チェック
export function isFutureDate(date: string): boolean {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}

// 予約可能期間チェック（最大1ヶ月先まで）
export function isWithinBookingPeriod(date: string): boolean {
  const inputDate = new Date(date);
  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  
  return inputDate >= today && inputDate <= maxDate;
}